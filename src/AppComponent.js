import React, { Component } from 'react';
import pathToRegexp from 'path-to-regexp';
import LoadBundle from './LoadBundlesUtils';
import * as internalCache from './internalCache';
import { axiosInstance } from './axiosInstance';

const APP_MODE = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV && process.env.NODE_ENV === 'production') ? 'prod' : 'dev';
export default class AppComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      component: null,
      appDetail: null,
      error: false,
      errorComponent: null,
      menuData: null,
      specs: null,
      hasError: false,
    };
    this.routeErrorJSX = <div>Unable to load route</div>;
    this.getComponent = this.getComponent.bind(this);
    this.loadMenu = this.loadMenu.bind(this);
    this.getSpecs = this.getSpecs.bind(this);
    this.loadRoute = this.loadRoute.bind(this);
    this.currentBundle = 0;
    this.specData = (window.uiLocalSpecs) ? window.uiLocalSpecs.specData : {};
  }

  componentDidMount() {
    const { appName } = this.props;
    const { menuName } = this.props;
    const { loadInternalRoute } = this.props;
    const { componentName } = this.props;
    const self = this;

    this.getSpecs(this.props, (response) => {
      let apiGwUrl = response.cdn;
      let specsData = response.specs;
      if (!apiGwUrl) {
        apiGwUrl = self.props.apiGwUrl;
        specsData = response;
      }
      if (appName && componentName) {
        self.getComponent(appName, self.props, null, false, specsData, componentName, apiGwUrl);
      } else if (appName) {
        self.getComponent(appName, self.props, null, false, specsData, null, apiGwUrl);
      } else if (menuName) {
        self.loadMenu(menuName, specsData, self.props, apiGwUrl);
      } else if (loadInternalRoute) {
        self.loadRoute(specsData, self.props, apiGwUrl);
      }
    });
  }

  componentWillReceiveProps(nextProps) {
    const { appName } = nextProps;
    const { menuName } = nextProps;
    const { loadInternalRoute } = nextProps;
    const { componentName } = nextProps;
    const self = this;
    this.currentBundle = 0;
    this.getSpecs(nextProps, (response) => {
      let apiGwUrl = response.cdn;
      let specsData = response.specs;
      if (!apiGwUrl) {
        apiGwUrl = nextProps.apiGwUrl;
        specsData = response;
      }
      if (appName && componentName) {
        self.getComponent(appName, nextProps, null, false, specsData, componentName, apiGwUrl);
      } else if (appName) {
        self.getComponent(appName, nextProps, null, false, specsData, null, apiGwUrl);
      } else if (menuName) {
        self.loadMenu(menuName, specsData, nextProps, apiGwUrl);
      } else if (loadInternalRoute) {
        self.loadRoute(specsData, nextProps, apiGwUrl);
      }
    });
  }

  componentDidCatch(error) {
    console.log(error);
  }

  getSpecs(props, callback) {
    const self = this;
    const { customAxiosInstance } = this.props;
    const api = customAxiosInstance || axiosInstance;
    if (internalCache.appSpecs
      && (internalCache.appSpecs.length > 0 || internalCache.appSpecs.specs)) {
      callback(internalCache.appSpecs);
    } else {
      api.get(`${props.apiGwUrl}/apigw/v1/register/UI`).then((res) => {
        internalCache.appSpecs = res.data;
        callback(res.data);
      }, () => {
        if (APP_MODE === 'prod') {
          self.setState({
            loading: false,
            errorComponent: <div>Unable to load component</div>,
            error: true,
          });
        } else {
          internalCache.appSpecs = this.specData;
          callback(this.specData);
        }
      });
    }
  }

  getComponent(name, props, menuData, isMenu, specsData, componentName, apiGwUrl) {
    const self = this;
    this.setState({ loading: true });
    LoadBundle(name, specsData, apiGwUrl, props.token, (result, appDetail) => {
      if (result) {
        const appModule = window[appDetail.library];
        if (isMenu) {
          self.currentBundle += 1;
          if (self.currentBundle === menuData.length) {
            self.setState({
              loading: false,
              menuData,
              error: false,
            });
          }
        } else if (componentName) {
          if (appModule) {
            const component = appModule[componentName];
            self.setState({
              loading: false,
              component,
              appDetail,
              error: false,
            });
          } else {
            self.setState({
              loading: false,
              errorComponent: <div>Unable to load component</div>,
              error: true,
            });
          }
        } else if (appModule) {
          // let component = React.createElement(eval(appDetail.library).App, self.dataProps);

          const routeData = appModule.Routes;
          let component = null;
          const path = window.location.pathname.replace(self.props.routeUrl, '');
          routeData.some((route) => {
            if (path === '' || path === '/') {
              component = route.component;
            } else if (self.props.match.params) {
              const re = pathToRegexp(route.path);
              const params = re.exec(self.props.match.params[0]);
              const props = { ...self.props, ...self.props };
              props.match.params = params;
              component = route.component;
            }
          });

          self.setState({
            loading: false,
            component,
            appDetail,
            error: false,
          });
        } else {
          setTimeout(() => {
            // let component = React.createElement(eval(appDetail.library).App, self.dataProps);
            const routeData = appModule.Routes;
            let component = null;
            routeData.some((route) => {
              if (self.props.match.url && self.props.match.url === self.props.routeUrl) {
                component = route.component;
              } else if (self.props.match.params) {
                const re = pathToRegexp(route.path);
                const params = re.exec(self.props.match.params[0]);
                const props = { ...self.props };
                props.match.params = params;
                component = route.component;
              }
            });

            self.setState({
              loading: false,
              component,
              appDetail,
              error: false,
            });
          }, 5000);
        }
      } else {
        self.setState({
          loading: false,
          errorComponent: <div>Unable to load component</div>,
          error: true,
        });
      }
    });
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  loadRoute(specsData, dataProps, apiGwUrl) {
    if (Array.isArray(specsData)) {
      const self = this;
      this.setState({
        loading: true,
      });
      let isRouteComponentFound = false;
      let isRouteFoundInSpec = false;
      let validSpec;
      let params = null;

      isRouteFoundInSpec = specsData.some((service) => {
        const routes = service.spec.sharedRoutes;
        return routes.some((route) => {
          if (dataProps.match.params) {
            const re = pathToRegexp(route);
            params = null;

            if (dataProps.match.params[0].startsWith('/')) {
              params = re.exec(dataProps.match.params[0]);
            } else {
              params = re.exec(`/${dataProps.match.params[0]}`);
            }
            if (params) {
              validSpec = service.spec;
              return true; // Exit loop if route found
            }
          }
        }); // Exit loop if route found
      });

      if (isRouteFoundInSpec) {
        // Error handling will fail here if there are multiple JS bundles..
        LoadBundle(validSpec.name, specsData, apiGwUrl, dataProps.token, (result, appDetail) => {
          if (result) {
            const appModule = window[appDetail.library];
            const routeData = appModule && appModule.Routes || [];
            let component = null;
            routeData.some((appRoute) => {
              const curRoute = dataProps.match.params[0];
              if (pathToRegexp(appRoute.path).exec(curRoute.startsWith('/') ? curRoute : `/${curRoute}`)) {
                const props = { ...dataProps };
                props.match.params = params;
                // Currently not supporting passing of context to component based on routes
                component = appRoute.component;
                isRouteComponentFound = true;
                self.setState({
                  loading: false,
                  component,
                  appDetail,
                  error: false,
                });
                return true;
              }
            });

            if (!isRouteComponentFound) {
              self.setState({ loading: false, errorComponent: self.routeErrorJSX, error: true });
            }
          } else {
            self.setState({
              loading: false,
              errorComponent: <div>Unable to load resource</div>,
              error: true,
            });
          }
        });
      } else {
        this.setState({
          loading: false,
          errorComponent:
        this.routeErrorJSX,
          error: true,
        });
      } // Show error if route is not in sharedRoutes
    } else {
      this.setState({ loading: false, errorComponent: this.routeErrorJSX, error: true });
    }
  }

  loadMenu(menuName, specsData, dataProps, apiGwUrl) {
    const self = this;
    const tabData = [];
    const menuData = [];
    Array.isArray(specsData) && specsData.forEach((service) => {
      const isNavigation = service.spec.navigation && service.spec.navigation.length >= 0;

      if (isNavigation && service.spec.navigation[0].tabs) {
        service.spec.navigation.forEach((navigation) => {
          if (navigation.menuName === menuName && navigation.tabs) {
            const obj = {
              tabs: navigation.tabs,
              microService: service.service_name,
              routes: service.spec.sharedRoutes,
            };

            tabData.push(obj);
          }
        });
      } else if (isNavigation && service.spec.navigation[0].menuName === menuName) {
        // No tabs available, so load the first component and return
        const obj = {
          componentName: service.spec.navigation[0].componentName,
          microService: service.service_name,
          routes: service.spec.sharedRoutes,
        };

        menuData.push(obj);
      }
    });
    // }

    if (menuData.length > 0 || tabData.length > 0) {
      menuData.forEach((data) => {
        self.getComponent(data.microService,
          dataProps, [data], null,
          specsData, data.componentName,
          apiGwUrl);
      });

      tabData.forEach((data) => {
        self.getComponent(data.microService, dataProps, tabData, true, specsData, null, apiGwUrl);
      });
    } else {
      this.setState({ loading: false, menuData: [] });
    }
  }

  render() {
    const {
      hasError, loading, error, component, appDetail, menuData,
    } = this.state;
    const {
      fallbackComponent, loaderComponent, overrideComponent, routeUrl,
    } = this.props;
    if (hasError) {
      return (
        fallbackComponent || <h2 style={{ textAlign: 'center', padding: '10px' }}>An error has occurred while loading the page.</h2>
      );
    }
    if (loading) {
      return (
        loaderComponent || <div className="lmask">loading...</div>
      );
    }
    if (!error) {
      if (!overrideComponent) {
        if (component) {
          return (
            <div>
              {React.createElement(component, { ...this.props, ...appDetail })}
            </div>
          );
        }
        return null;
      }
      return React.createElement(overrideComponent, {
        error: false,
        appDetail,
        routeUrl,
        menuData,
        componentLoaded: internalCache.componentLoaded,
        ...this.props,
      });
    }
    if (error && overrideComponent) {
      return React.createElement(overrideComponent, {
        error: true, appDetail: [], routeUrl, menuData: [], componentLoaded: [], ...this.props,
      });
    }
    return (
      fallbackComponent || (
      <div>
        {this.state.errorComponent || 'Unable to load component'}
      </div>
      )
    );
  }
}
