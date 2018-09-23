
module.exports = function(app){
  
  let GoogleImages = require('google-images');
  let ig = require('instagram-node').instagram();
  let igScrap = require('instagram-scraping');
  let fs = require('fs')
  var uuid = require('uuid')
  var rp = require('request-promise').defaults({simple: false})
  
  var multer = require('multer')
  
  let accessToken = ''
  
  //the redirect uri we set when registering our application
  var redirectUri = 'http://localhost:3000/instagram_callback';
  
  app.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
  });
  
  app.get('/images/:text', (req, res) => {
  
    let textSearch = req.params.text
  
    const client = new GoogleImages(process.env.CSEID, process.env.APIKEY);
    
    let options = {
      imgSize: 'small',
      imgtype: "image/jpg"
    }
    
    let promiseGoogleImagesWallPaper = new Promise((resolve, reject) => {
      client.search(textSearch + ' wallpaper', options).then(result => {
        resolve(result)
      }).catch(e => {
        resolve('ERRO')
      })
    })

    let promiseGoogleImagesLook = new Promise((resolve, reject) => {
      client.search(textSearch + ' roupa', options).then(result => {
        resolve(result)
      }).catch(e => {
        resolve('ERRO')
      })
    })

    let promiseGoogleImagesSimilares = new Promise((resolve, reject) => {
      client.search('pessoas famosas roupass', options).then(result => {
        resolve(result)
      }).catch(e => {
        resolve('ERRO')
      })
    })

    // let promiseIgScrap = new Promise((resolve, reject) => {
      
    //   try{
        
    //     igScrap.scrapeTag(textSearch).then(result => {
    //       resolve(result)
    //     }).catch(e => {
    //       resolve('ERRO')
    //     })
    //   }
    //   catch(error){
    //     console.log('error **')
    //   }

    // })

    Promise.all([promiseGoogleImagesWallPaper, promiseGoogleImagesLook, promiseGoogleImagesSimilares]).then((results) => {

      console.log(results)
              
      let _googleImagesWallpaper
      let _googleImagesLook
      let _googleImagesSimilares
      let _igImages

      if(results[0] == 'ERRO'){
        _googleImagesWallpaper = []
      }
      else{
        _googleImagesWallpaper = results[0][0].url
      }

      if(results[1] == 'ERRO'){
        _googleImagesLook = []
      }
      else{
        _googleImagesLook = results[1].slice(1, 12).map((imageData, imageIndex) => {
          return imageData.url
        })
      }

      if(results[2] == 'ERRO'){
        _googleImagesSimilares = []
      }
      else{
        _googleImagesSimilares = results[2].slice(1, 12).map((imageData, imageIndex) => {
          return imageData.url
        })
      }

      // if(results[1] == 'ERRO' || results[1] == undefined){
      //   _igImages = []
      // }
      // else{

      //   if(results[1].medias != undefined){
          
      //     _igImages = results[1].medias.slice(0, 10).map((imageData, imageIndex) => {
      //       return imageData.display_url
      //     })
      //   }
      // }

      // let urls = _googleImagesLook
      
      let resp = {
        name: textSearch,
        "image-hero": _googleImagesWallpaper,
        looks: _googleImagesLook,
        similars: _googleImagesSimilares
      }

      res.send(resp)


    }).catch((e) => {

      console.log('=======================')
      console.log(e)
      console.log('=======================')

      res.send('Erro')

    })
  
  })
  
  app.get('/instagram_callback', (req, res) => {
  
    //retrieves the code that was passed along as a query to the '/handleAuth' route and uses this code to construct an access token
    ig.authorize_user(req.query.code, redirectUri, function(err, result){
        if(err) res.send(err);
  
        // store this access_token in a global variable called accessToken
        accessToken = result.access_token;
  
        console.log('accessToken')
        console.log(accessToken)
  
        ig.use({
          access_token: accessToken
        });
  
        console.log('pesquisando imagens por tag')
        ig.tag_media_recent('cachorro', function(err, result, pagination, remaining, limit) {
  
          console.log(result)
          console.log(pagination)
    
          // res.send(images)
          res.send('1')
  
        })
  
    });
  
  })
  
  app.get('/authorize', (req, res) => {
  
    ig.use({
      client_id: '742f8aeca20847e1a4184c5dabd5ee04',
      client_secret: '09a05cf282f34e368491708a8ee9a69d'
    });
  
    // set the scope of our application to be able to access likes and public content
    res.redirect(ig.get_authorization_url(redirectUri, { scope : ['public_content','likes']}) );
  });
  
  var upload = multer({ 
    dest: 'uploads/' 
  })
  
  app.post('/upload', upload.any(), (req, res) => {
    
    console.log(req.files)

    let fileName = req.files[0].filename

    let _uuid = uuid.v4()

    fs.rename('./uploads/' + fileName, './uploads/' + _uuid, (err) => {

      if (err) throw err;
      console.log('renamed')
      res.send(_uuid)

    })
    
  })

  app.get('/get_image/:uuid', (req, res) => {
    
    var _uuid = req.params.uuid

    var imagemPath = './uploads/'+_uuid

    // Configura o retorno do content
    res.set('Content-Type', 'image/png')

    // Efetua leitura da imagem
    fs.readFile(imagemPath, function(err, data) {

      if(err) throw err
      
      res.send(data)
      
    })

  })

  app.post('/upload_product', (req, res) => {

    let _uuid = uuid.v4()

    let data = req.body.base64

    fs.writeFile('./uploads/' + _uuid, data, (err) => {

      if(err) throw err

      console.log('image product saved!')
      console.log({_uuid})

      res.json({_uuid})

    })
    
  })

  app.post('/api/broadcast', (req, res) => {

    console.log(req.body)

    // res.send('1')

//     { idCliente: '1',
//  resultado_vr: '[{"articles":[{"bounding_box":{"y0":160,"x1":414,"x0":224,"y1":496},"primaryColor":"#241510","article_name":"tank top","confidence":0.97983783483505249}],"imageURL":"https:\\/\\/diariodegoias.com.br\\/images\\/stories\\/imagens\\/2017\\/outubros\\/anitta_roupa_curta_.jpg"},{"articles":[{"bounding_box":{"y0":108,"x1":460,"x0":363,"y1":231},"primaryColor":"#e6bdac","article_name":"tank top","confidence":0.50475949048995972},{"bounding_box":{"y0":211,"x1":271,"x0":138,"y1":285},"primaryColor":"#d8a68d","article_name":"shorts","confidence":0.81602275371551514},{"bounding_box":{"y0":94,"x1":279,"x0":122,"y1":258},"primaryColor":"#edc2b2","article_name":"blouse","confidence":0.85293906927108765}],"imageURL":"http:\\/\\/s2.glbimg.com\\/jD9zeQccxQaCanfUcmL-w-CnJ6o=\\/620x465\\/s.glbimg.com\\/jo\\/eg\\/f\\/original\\/2015\\/07\\/05\\/manu1622.jpg"}]',
// 2018-09-23T15:01:11.783235+00:00 app[web.1]:   texto_chave: 'Anitta' }

    let url = 'http://hackathon-iguatemi.mybluemix.net/api/broadcast'

    let requestOptions = {
      uri: url,
      method: 'post',
      resolveWithFullResponse: true,
      form: {
        "texto_chave": req.body.texto_chave,
        "idCliente" : req.body.idCliente,
        // "resultado_vr": JSON.stringify(req.body.resultado_vr),
        "url" : ""
      }
    }

    rp(requestOptions).then((response) => {

      let body = response.body

      console.log(body)

      res.send('1')

    })

  })

  app.get('/get_image_product/:uuid', (req, res) => {
    
    var _uuid = req.params.uuid

    var imagemPath = './uploads/'+_uuid

    // Configura o retorno do content
    // res.set('Content-Type', 'image/jpg')

    // Efetua leitura da imagem
    fs.readFile(imagemPath, function(err, data) {

      if(err) throw err
      
      res.json({data})
      
    })

  })


}

