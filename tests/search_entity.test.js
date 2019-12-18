
import {make_mongo_text_search,make_mongo_text_projection,mongoose_default_search} from '../src/search_entity'



test ('make mongo search', ()=>{

  expect(make_mongo_text_search(false)).toBeInstanceOf(Function)
  expect(make_mongo_text_search(false,null)).toBeInstanceOf(Function)
   expect(make_mongo_text_search(false,'french')).toBeInstanceOf(Function)


  expect (
     make_mongo_text_search(false,'french','est')
  ).toEqual(
    {
       "$text":  {
         "$caseSensitive": false,
         "$language": "french",
         "$search": "est",
       }
     }
  )

  //testing that undefined or null language becomes "none"
  expect (
     make_mongo_text_search(false,null,'est')
  ).toEqual(
    {
       "$text":  {
         "$caseSensitive": false,
         "$language": "none",
         "$search": "est",
       }
     }
  )

  expect (
     make_mongo_text_search(false,undefined,'est')
  ).toEqual(
    {
       "$text":  {
         "$caseSensitive": false,
         "$language": "none",
         "$search": "est",
       }
     }
  )
})

test ('make mongo default search', ()=>{

  expect(mongoose_default_search('french')).toBeInstanceOf(Function)
  expect(mongoose_default_search('french','blabla')).not.toBeInstanceOf(Function)
  expect(mongoose_default_search('french','blabla')).toEqual(
    {
       "$text":  {
         "$caseSensitive": false,
         "$language": "french",
         "$search": "blabla",
       }
     }
  )

})


test ('make mongo projection', ()=>{

  expect(make_mongo_text_projection('french')).toBeInstanceOf(Object)
  expect(make_mongo_text_projection('french')).toEqual({"score": {"$meta": "french"}})

})
