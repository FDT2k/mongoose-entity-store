
import {make_mongo_text_search,make_mongo_text_projection,mongoose_default_search,mongoose_text_search} from '../src/search_entity'



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


test ('mongo search task', (done)=>{


  let mockModel = _ =>( {
    find:   (...args)=> {console.log(args); return mockModel()},
    sort:   (sort)=>{ return mockModel()  },
    limit:  (sort)=>{ return mockModel()  },
    catch:  (_catch)=>{  return mockModel()  },
    then:   (_then)=>{ _then({results:['a','b']}); return mockModel()  }
  })

  let test = mongoose_text_search(mongoose_default_search,make_mongo_text_projection,mockModel(),20,'french','test')

  test.fork(
    (res)=> console.log('error',res),
    (res)=>{console.log(res); done()},
  );

})


test ('mongo entity search service', (done)=>{


  let mockModel = _ =>( {
    find:   (...args)=> {console.log(args); return mockModel()},
    sort:   (sort)=>{ return mockModel()  },
    limit:  (sort)=>{ return mockModel()  },
    catch:  (_catch)=>{  return mockModel()  },
    then:   (_then)=>{ _then({results:['a','b']}); return mockModel()  }
  })

  let test = mongoose_text_search(mongoose_default_search,make_mongo_text_projection,mockModel(),20,'french','test')

  test.fork(
    (res)=> console.log('error',res),
    (res)=>{console.log(res); done()},
  );



})
