/* eslint-disable class-methods-use-this */
/* eslint-disable no-underscore-dangle */
let log = self.console.log.bind(self.console);
self.importScripts("/src/lib/lib/jpg.js");
self.importScripts("/src/PNGDecoder.js");
self.importScripts("/src/pako_inflate.min.js");
class ImageHandler {
  constructor (workerContext) {
    this.queue = [];
    this.workerContext = workerContext;
  }

  enqueue (toEnqueue) {
    // Bail if this URL is already enqueued.
    if (this.queue.indexOf(toEnqueue) >= 0)
      return;
    if (!toEnqueue) {
      return;
    }
    this.queue.push(toEnqueue);
    this.processQueue();
  }


  loadJpeg (url) {
    return new Promise((resolve, reject) => {
      const jpegloader = new JpegImage();
      try {
        jpegloader.load(url);
      } catch(e) {
        console.log(e);
      }
      
      jpegloader.onload = () => {
        const values = jpegloader.getData(jpegloader.width, jpegloader.height, false);
        resolve ({url,
          success: true,
          values,
          width: jpegloader.width,
          height: jpegloader.height,});
      };
    });
  }

  loadPng(url) {
    return new Promise((resolve, reject) => {
      const pngloader = new PNGDecoder();
      pngloader.load(url, (m) => {
        if (m === false) {
          reject(m);
        } else {
          console.log('png load onload');
          resolve ({ 
            success: true,
            url,
            values:m.data,
            width: m.header.data.width,
            height: m.header.data.height,
          });
        }
      });
    });
  }

  

  processQueue () {
    if (this.queue.length === 0)
      return;
    let url = this.queue.shift();
    if (url.type == 'image/jpeg') {
      this.loadJpeg(url.url).then((msg) => {
        console.log('jpg....sucesss');
        this.workerContext.postMessage(msg);
        //console.log(msg)
        this.processQueue();
      }).catch(()=> {
        onsole.log('jpg....erer');
        this.workerContext.postMessage({
          success: false,
          url:url.url,
        });
        this.processQueue();
      });
    } 
    else if(url.type == 'image/png') 
    {
      console.log('load png');
      this.loadPng(url.url).then((msg) => {
        this.workerContext.postMessage(msg);
        console.log(msg);
        this.processQueue();
      }).catch(()=> {
        console.log('png....erer');
        this.workerContext.postMessage({
          success: false,
          url:url.url,
        });
      });
    }
  }

}



let handler = new ImageHandler(self);
self.onmessage = (evt) => {
  //console.log(evt);
  handler.enqueue(evt.data);
}
