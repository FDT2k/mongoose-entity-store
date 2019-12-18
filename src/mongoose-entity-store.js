const _ = require('lodash');
const AsyncLock = require('async-lock');
const lock =new AsyncLock({maxPending:10000});
const { validate, ParameterValidationError } =require ('parameter-validator');
const {InvalidPayloadError,EntityNotFoundError} = require('../errors');
const {remove_metas } = require('../payload_utils');
var SerialisedError = require('serialised-error')
const { pipe } = require('@geekagency/composite-js/src/index');

/*
Factory that export entities handling function
*/

module.exports = (nats, entity_name,plural_entity_name, MongooseModel,options={})=>{

  const mongoose_entity_to_object = (entity)=>{
    entity = entity.toObject();
    entity.id = entity._id;
    return entity
  }

  const _export_entity =  (entity) =>{
    return entity;
  }

  const export_entity = pipe(
    mongoose_entity_to_object,
    _export_entity
  )

  const search_entity = (...[payload,replyTo,...passThrough])=>{
    let response = {success:false}
    try {
      const {term} = validate(payload,['term']);
      MongooseModel.find(
        {
          $text:
            {
              $search: term,
              $caseSensitive: false,
              $language:'french'
            }
          },{ score: { $meta: "textScore" }
        })
      .sort({ score: { $meta: "textScore" } })
      .limit(20)
      .then((entities)=>{
        response.success = true;
        response[plural_entity_name] = entities;
        nats.replyIfNeeded(replyTo,response);
      }).catch(err=>{
        response.error = new SerialisedError(err);
        nats.replyIfNeeded(replyTo,response);
      });;
    } catch (err) {
      response.error = new SerialisedError(err);
      nats.replyIfNeeded(replyTo,response);
    }
    return [payload,replyTo,...passThrough]

  }

  const upsert_entity = (...[payload,replyTo,...passThrough])=>{
    let response = {success:false}
    try {
      const {filter,data} = validate(payload,['filter','data']);
      lock.acquire('key', async (unlock) => {
        //console.log(filter);
        MongooseModel.findOneAndUpdate(filter, { $set: data}, { new: true,upsert:true }).then((entity)=>{
          unlock();
          response.success=true;
          response[entity_name]=export_entity(entity);
          nats.replyIfNeeded(replyTo,response);
        }).catch(err=>{
          unlock();
          response.error = new SerialisedError(err);
          nats.replyIfNeeded(replyTo,response);
        });
      }).catch(err=>{
        response.error = new SerialisedError(err);
        nats.replyIfNeeded(replyTo,response);
      });
    } catch (err) {
      response.error = new SerialisedError(err);
      nats.replyIfNeeded(replyTo,response);
    }
    return [payload,replyTo,...passThrough]

  }

  const insert_entity = (...[payload,replyTo,...passThrough])=>{
    let response = {success:false}
    try {
      if(_.isFunction(options.validateCreate)){
        if(!options.validateCreate(payload)){
          nats.replyIfNeeded(replyTo,new InvalidPayloadError('payload validation failed'));
          return ;
        }
      }

      if(_.isFunction(options.normalizeCreate)){
        payload = options.normalizeCreate(payload);
      }

      let food = new MongooseModel(payload);

      food.save().then((_entity)=>{
        response.success=true;
        response[entity_name]=export_entity(_entity);
        nats.replyIfNeeded(replyTo,response);
      }).catch(err=>{
        response.error = new SerialisedError(err);
        nats.replyIfNeeded(replyTo,response);
      });;
    } catch (err) {
      response.error = new SerialisedError(err);
      nats.replyIfNeeded(replyTo,response);
    }
    return [payload,replyTo,...passThrough]
  }

  const update_entity = (...[payload,replyTo,...passThrough])=>{
    let response = {success:false}
    try {
      const {filter,data} = validate(payload,['filter','data']);
      MongooseModel.findOneAndUpdate(filter, { $set: data}, { new: true }).then((entity)=>{
        response.success=true;
        response[entity_name]=export_entity(entity);
        nats.replyIfNeeded(replyTo,response);
      }).catch(err=>{
        response.error = new SerialisedError(err);
        nats.replyIfNeeded(replyTo,response);
      });
    } catch (err) {
      response.error = new SerialisedError(err);
      nats.replyIfNeeded(replyTo,response);
    }
    return [payload,replyTo,...passThrough]
  }

  const get_entity = (...[payload,replyTo,...passThrough])=>{
    let response = {success:false}
    try {

      if(_.keys(payload).length ==0){
        throw new InvalidPayloadError('specify a valid payload to get a record');
      }

      let filter = payload;
      filter = remove_metas(filter);

      MongooseModel.findOne(filter).then((result)=>{
        if(!_.isNull(result)){
          response.success = true;
          response[entity_name]= export_entity(result);
          nats.replyIfNeeded(replyTo,response);
        }else{
          response = new EntityNotFoundError('entity not found');
          nats.replyIfNeeded(replyTo,response);
        }
      }).catch(err=>{
        response.error = new SerialisedError(err);
        nats.replyIfNeeded(replyTo,response);
      });
    } catch (err) {
      response.error = new SerialisedError(err);
      nats.replyIfNeeded(replyTo,response);
    }
    return [payload,replyTo,...passThrough]

  }

  const delete_entity = (...[payload,replyTo,...passThrough])=>{
    let response = {success:false}
    try {
      //const {filter,data} = validate(payload,['filter']);
      if(_.keys(payload).length ==0){
        throw new InvalidPayloadError('specify a valid payload to remove a record');
      }

      let filter = payload;
      filter = remove_metas(filter);

      MongooseModel.findOneAndRemove(filter).then((entity)=>{
        response.success=true;
        response[entity_name]=export_entity(entity);
        nats.replyIfNeeded(replyTo,response);
      }).catch(err=>{
        response.error = new SerialisedError(err);
        nats.replyIfNeeded(replyTo,response);
      });;
    } catch (err) {
      response.error = new SerialisedError(err);
      nats.replyIfNeeded(replyTo,response);
    }
    return [payload,replyTo,...passThrough]


  }


  const list_entity = (...[payload,replyTo,...passThrough])=>{
    let response = {success:false}
    try {
      let filter = payload || {};
      filter = remove_metas(filter);
      MongooseModel.find(filter).then((results)=>{
        response.success = true;
        response[plural_entity_name] = _.map(results,(result)=>{
          return export_entity(result);
        });
        nats.replyIfNeeded(replyTo,response);

      }).catch(err=>{

        response.error = new SerialisedError(err);
        nats.replyIfNeeded(replyTo,response);

      });
    } catch (err) {
      response.error = new SerialisedError(err);
      nats.replyIfNeeded(replyTo,response);
    }
    return [payload,replyTo,...passThrough]
  }

  return {
    search_entity,
    upsert_entity,
    insert_entity,
    update_entity,
    get_entity,
    delete_entity,
    list_entity,
    export_entity
  }

}
