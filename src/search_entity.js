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
  Using a search and a projection generating function: generate a task that perform the search_query

  MakeSearch = String -> String -> Object == Language -> SearchTerm -> MongoQuery
  MakeProjection = String -> Object == Meta -> MongoProjection
*/
// FN -> FN -> MongooseModel -> Integer-> String -> String -> Promise
export const mongoose_text_search = C.curry(
  ( MakeSearch, MakeProjection,  Model, limit, lang, term  ) => {
    const projection = MakeProjection('textScore');
    const search_query = MakeSearch(lang,term);
    return new C.Task ( (reject,resolve) => Model.find(search_query,projection).sort(projection).limit(limit).then(resolve).catch(reject) )
  }
)


const defaultCatcher = Broker => Payload => Broker.replyIfNeeded(err);



//  Settings -> Broker -> Payload
/*
SearchTask ::  String -> Task
Broker
Payload :: Object
*/
export const make_search_entity_service = C.curry ((SearchTask,payload,replyTo)=>{
  let response = {success:false}
  const {term} = validate(payload,['term']);
  SearchTask(term).fork(
    (err)=>Broker.replyIfNeeded(err),
    (entities)=>{
      response.success = true;
      response[plural_entity_name] = entities;
      Broker.replyIfNeeded(response)
    }
  )
});
