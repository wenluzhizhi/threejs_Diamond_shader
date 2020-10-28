/* eslint-disable class-methods-use-this */
/* eslint-disable no-useless-constructor */
/* eslint-disable no-unused-vars */
import {
	DataTexture,
	LinearFilter,
	LinearMipmapLinearFilter,
	RGBAFormat,
	RGBFormat,
} from "./three.module.js";

class CustomDataTextureLoader {
  constructor() {
     this.loaderWorker = new Worker('/src/lib/work.js');
		 this.map = new Map();
		 this.count = 0;
     this.loaderWorker.onmessage = (evt) => {
       const {data} = evt;
      //  console.log('customDataTextureLoader get back postMessage');
      //  console.log(data);

       if (this.map.has(data.url)) {
          //console.log('want to generate texure!');
          if (!data.success) {
            const {reject} = this.map.get(data.url);
            if (reject) {
              reject();
            }
          } else {
          const callback = this.map.get(data.url).onLoad;
          const {type} = this.map.get(data.url);
          if (type === 'image/png') {
            console.log(data);
          }
          const format = type === 'image/jpeg' ? RGBFormat : RGBAFormat;
          var tex = new DataTexture(data.values, data.width, data.height, format);
          // 所有参数保持texure的默认值
					tex.needsUpdate = true;
					tex.generateMipmaps = true
					tex.isCompressedTexture = false;
					tex.minFilter = LinearMipmapLinearFilter;
					tex.magFilter = LinearFilter;
          tex.flipY = true;
          //console.log(data.url);
          // console.log('---------------callback---------------------');
          // console.log(callback);
          callback(tex);
        }
       }
     }
  }


  load (url, onLoad, progress, reject, type) {
    //console.log(url);
		this.loaderWorker.postMessage({url, type})
		this.map.set(url, {onLoad, type, reject});
  }
}
export { CustomDataTextureLoader };