import * as C from '@geekagency/composite-js'


// String -> Object
export const make_language =  C.compose(C.as_prop('$language'),C.defaultTo('none'))

//  Bool -> String -> String -> Object
export const make_mongo_text_search = C.curry(($caseSensitive,$language,$search)=>({$text:{$search,...make_language($language),$caseSensitive}}))
//  String -> Object
export const make_mongo_text_projection = $meta => ({ score: { $meta }})


// String -> Object

export const mongoose_default_search = C.curry((lang,term)=> make_mongo_text_search(false,lang,term) );


/*
  Using a search and a projection generating function

  MakeSearch = String -> String -> Object == Language -> SearchTerm -> MongoQuery
  MakeProjection = String -> Object == Meta -> MongoProjection
*/
// FN -> FN -> MongooseModel -> Integer-> String -> String -> Promise
const mongoose_text_search = C.curry(
  ( MakeSearch, MakeProjection,  Model, limit, lang, term  ) => {
    const projection = MakeProjection('textScore');
    const search_query = MakeSearch(lang,term);
    return new C.Task ( (reject,resolve) => Model.find(search_query,projection).sort(projection).limit(limit).then(resolve).catch(reject) )
  }
)

//  Settings -> Broker -> Payload
export const search_entity = C.curry ((SearchTask,Broker,Payload)=>{
  let response = {success:false}
  let projection = make_mongo_text_projection('textScore');

  try {
    const {term} = validate(payload,['term']);

    MongooseModel.find(make_mongo_text_search(false,'french',term),projection)
      .sort(projection)
      .limit(20)
      .then((entities)=>{
        response.success = true;
        response[plural_entity_name] = entities;
        Broker.replyIfNeeded(response)
      }).catch(err=>{
        Broker.replyIfNeeded(err);
      });
  } catch (err) {
    Broker.replyIfNeeded(err);
    return;
  }

})
