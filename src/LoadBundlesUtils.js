import * as internalCache from './internalCache';

function loadJS(jsElement, appDetail, apiGWURl, token, callback) {
  // DOM: Create the script element
  const jsElm = document.createElement('script');
  // set the type attribute
  jsElm.type = 'text/javascript';

  if (appDetail.containerName) {
    jsElm.src = `${apiGWURl}/${appDetail.containerName}/${jsElement.fileName}.js`;
  } else {
    jsElm.src = `${apiGWURl}/${appDetail.name}/${appDetail.version}/${jsElement.fileName}.js`;
  }

  if (token && token.indexOf('undefined') === -1) {
    jsElm.src += token;
  }

  if (jsElm.readyState) { // IE
    jsElm.onreadystatechange = () => {
      if (jsElm.readyState === 'loaded'
                || jsElm.readyState === 'complete') {
        jsElm.onreadystatechange = null;
        callback(true);
      }
    };
  } else { // Others
    jsElm.onload = () => {
      callback(true);
    };

    jsElm.onerror = () => {
      callback(false);
    };
  }
  // finally insert the element to the body element in order to load the script
  document.body.appendChild(jsElm);
}

function loadCSS(cssElement, appDetail, apiGWURl, token, callback) {
  const head = document.getElementsByTagName('head')[0];
  // DOM: Create the script element
  const cssElem = document.createElement('link');
  // set the type attribute
  cssElem.type = 'text/css';

  cssElem.rel = 'stylesheet';
  if (appDetail.containerName) {
    cssElem.href = `${apiGWURl}/${appDetail.containerName}/${cssElement.fileName}.css`;
  } else {
    cssElem.href = `${apiGWURl}/${appDetail.name}/${appDetail.version}/${cssElement.fileName}.css`;
  }

  if (token && token.indexOf('undefined') === -1) {
    cssElem.href += token;
  }

  head.appendChild(cssElem);

  if (cssElem.readyState) { // IE
    cssElem.onreadystatechange = () => {
      if (cssElem.readyState === 'loaded'
                || cssElem.readyState === 'complete') {
        cssElem.onreadystatechange = null;
        callback(true);
      }
    };
  } else { // Others
    cssElem.onload = () => {
      callback(true);
    };

    cssElem.onerror = () => {
      callback(false);
    };
  }
  // finally insert the element to the body element in order to load the script
}

function checkToken(token) {
  if (token && token.tokenPromise) return token.tokenPromise();
  return Promise.resolve();
}

export default function loadBundles(name, specsData, apiGWURl, token, callback) {
  const { componentLoaded } = internalCache;
  if (!componentLoaded[name] || (componentLoaded[name] && !componentLoaded[name].isLoaded)) {
    const serviceSpec = specsData.filter((data) => data.service_name === name);

    componentLoaded[name] = [];
    if (serviceSpec && serviceSpec.length > 0) {
      const appData = serviceSpec[0];
      let iterator = 0;
      let bundleQueryParams = '?';
      if (appData && appData.spec && appData.spec.resources.length > 0) {
        checkToken(token).then(tokenPromise => {
          bundleQueryParams += tokenPromise
            ? (token.parseData ? token.parseData(tokenPromise) : tokenPromise)
            : token;
          const appDetail = appData.spec;
          appDetail.resources.forEach(element => {
            if (element.type === 'javascript') {
              loadJS(element, appDetail, apiGWURl, bundleQueryParams, (isLoaded) => {
                iterator += 1;
                if (isLoaded) {
                  if (iterator === appDetail.resources.length) {
                    componentLoaded[name].isLoaded = true;
                    componentLoaded[name].appDetail = appDetail;
                    callback(true, appDetail);
                  }
                } else {
                  callback(false);
                }
              });
            } else {
              loadCSS(element, appDetail, apiGWURl, bundleQueryParams, (isLoaded) => {
                iterator += 1;
                if (isLoaded) {
                  if (iterator === appDetail.resources.length) {
                    componentLoaded[name].isLoaded = true;
                    componentLoaded[name].appDetail = appDetail;
                    callback(true, appDetail);
                  }
                } else {
                  callback(false);
                }
              });
            }
          });
        })
          .catch(() => {
            callback(false);
          });
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  } else if (componentLoaded[name].isLoaded) {
    const { appDetail } = componentLoaded[name];
    callback(true, appDetail);
  } else {
    callback(false);
  }
}
