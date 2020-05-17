import express, {Request, Response} from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {filterImageFromURL, deleteLocalFiles} from './util/util';

(async () => {

  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;
  
  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  // @TODO1 IMPLEMENT A RESTFUL ENDPOINT
  // GET /filteredimage?image_url={{URL}}
  // endpoint to filter an image from a public url.
  // IT SHOULD
  //    1. validate the image_url query
  //    2. call filterImageFromURL(image_url) to filter the image
  //    3. send the resulting file in the response
  //    4. deletes any files on the server on finish of the response
  // QUERY PARAMATERS
  //    image_url: URL of a publicly accessible image
  // RETURNS
  //   the filtered image file [!!TIP res.sendFile(filteredpath); might be useful]

  /**************************************************************************** */

  //! END @TODO1
  app.get('/filteredimage', async (req: Request, res: Response) => {
    let {image_url} = req.query;
    if (!image_url) {
      return res.status(400).send('Image url is required');
    }
    try {
      const filteredImagePath = await filterImageFromURL(image_url);    
      console.log(filterImageFromURL); 
      let filteredImages : string[] = [];
      filteredImages.push(filteredImagePath);
      return res.status(200).sendFile(filteredImagePath, (err) => {
        if (err) {
          throw err;
        }
        deleteLocalFiles(filteredImages);
      })
    } 
    catch (err){
      return res.status(501).send(`${err}`);
    }
  })
  

  // Set Storage
  const storage = multer.diskStorage({
    destination: (req, file, callback) => {
      const dir = './uploads';
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      callback(null, './uploads');
    },
    filename: (req, file, callback) => {
      callback(null, file.originalname)
    }
  })
  const uploadImage = multer({ storage: storage }).single('image');
  
  // Image upload endpoint
  app.post('/filteredimage', uploadImage , async (req, res) => {
    const image = req.file;
    if (!image) {
      const err = new Error('Image not found');
      return res.status(400).send(err);
    }
    try {
      const filteredImagePath = await filterImageFromURL(image.path);     
      let tempImages : string[] = [];
      tempImages.push(filteredImagePath, image.path);
      return res.status(200).sendFile(filteredImagePath, (err) => {
        if (err) {
          throw err;
        }
        deleteLocalFiles(tempImages);
      })
    } catch (err){
      return res.status(501).send(`${err}`);
    }
  })
  

  // Root Endpoint
  // Displays a simple message to the user
  app.get( "/", async ( req, res ) => {
    res.send("try GET /filteredimage?image_url={{}} <br/> or POST /filteredimage with an image in req body")
  } );
  

  // Start the Server
  app.listen( port, () => {
      console.log( `server running http://localhost:${ port }` );
      console.log( `press CTRL+C to stop server` );
  } );
})();