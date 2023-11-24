import type {
  AxiosInstance,
  AxiosProgressEvent,
  AxiosRequestConfig,
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig
} from 'axios';
import axios from 'axios';
import { stringify } from 'qs';
import type { IRequestOptions, ICreatOptions, IExtRequestConfig, IResponseData } from '../type/type';
import { assign } from 'lodash-es';
import { defaultRequestCfg } from './constant';

export class AxiosRequest<O = any, EE = any> {
  public axiosInstace: AxiosInstance;

  public requestConfig: ICreatOptions<O, EE>;

  public cancalControllerMap: Record<any, any>;

  constructor(axiosCfg?: AxiosRequestConfig, requestCfg?: ICreatOptions<O, EE> & Record<any, any>) {
    this.axiosInstace = axios.create(axiosCfg || {});
    const defCfg = { ...defaultRequestCfg }; // 防止污染默认配置
    this.requestConfig = assign(defCfg, requestCfg);
    this.cancalControllerMap = {};
    this.setInterceptors();
  }

  private setInterceptors() {
    this.setRequestInterceptors();
    this.setResponseInterceptors();
  }

  private setRequestInterceptors() {
    this.axiosInstace.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // 在发送请求之前做些什么
        return new Promise<IExtRequestConfig<O>>((resolve, reject) => {
          setTimeout(async () => {
            if (this.requestConfig.onBeforeRequestFn) {
              await this.requestConfig.onBeforeRequestFn(config as IExtRequestConfig<O>);
            }

            if (config.method?.toUpperCase() === 'GET') {
              /**
               * //axios get 会自动将 params 参数合并 query，无需自行实现
              if (config.params) {
                const queryString = stringify(config.params);
                const tempUrl = new URL(config.url);
                debugger;
                tempUrl.search = tempUrl.search ? `${tempUrl.search}&${queryString}` : queryString;
                const nURl = tempUrl.toString();
                config.url = nURl;
              }
               */
            } else if (config.method?.toUpperCase() === 'POST') {
              if (config.headers?.['Content-Type'] === 'application/x-www-form-urlencoded') {
                config.data = stringify(config.params || {});
              } else if (config.headers?.['Content-Type'] === 'multipart/form-data') {
                const formData = new FormData();
                const entries = Object.entries(config.params || {});
                await (async () => {
                  for (const [key, value] of entries) {
                    formData.append(key, value as string | Blob);
                  }
                })();
                // eslint-disable-next-line require-atomic-updates
                config.data = formData;
              }
              // config.params = undefined;
            }
            resolve(config as any);
          });
        });
      },
      error => {
        // 对请求错误做些什么
        console.log('request error', error);
        return Promise.reject(error);
      }
    );
  }

  private setResponseInterceptors() {
    // 添加响应拦截器
    this.axiosInstace.interceptors.response.use(
      (response: AxiosResponse<IResponseData, any>) => {
        // 2xx 范围内的状态码都会触发该函数。
        // 对响应数据做点什么
        return new Promise<IResponseData<any> | AxiosResponse<IResponseData, any>>((resolve, reject) => {
          console.log('interceptors response resp', response);
          setTimeout(async () => {
            if (this.requestConfig.onAfterRequestSuccess) {
              try {
                const parsedData = await this.requestConfig.onAfterRequestSuccess(response);

                resolve(parsedData);
              } catch (e) {
                reject(e);
              }
            } else {
              resolve(response);
            }
          });
        }) as any;
      },
      (error: AxiosError<EE>) => {
        // 超出 2xx 范围的状态码都会触发该函数。
        // 对响应错误做点什么
        return new Promise((resolve, reject) => {
          console.log('interceptors response error', error);
          setTimeout(async () => {
            if (this.requestConfig.onAfterRequestFailed) {
              const parsedErr = this.requestConfig.onAfterRequestFailed(error);
              reject(undefined);
            } else {
              return Promise.reject(error);
            }
          });
        });
      }
    );
  }

  private getUserId() {
    if (this.requestConfig.onGetUserIdFn) {
      return this.requestConfig.onGetUserIdFn();
    }
    return 'anybody';
  }

  /**
   * 发起网络请求
   * @param url get 的 url ，post 的 uripath
   * @param method  {'get' | 'post' }请求方式
   * @param params { Object } 参数
   * @param  requestOptions {} 请求辅助选项
   * @return 成功： {<D> | IRequestOptions<D>}  失败: { Error }
   */
  // eslint-disable-next-line max-params
  doRequest<D>(
    url: string,
    method: 'get' | 'post',
    params: Record<any, any> | undefined = undefined,
    requestOptions: IRequestOptions<O> & { __reqid__?: string } = { cancelFnRef: undefined } as any
  ) {
    return new Promise<D | IResponseData<D>>((resolve, reject) => {
      const tempParams = { __reqid__: `${new Date().getTime()}_${performance.now()}_${this.getUserId()}` };

      const cfg: IExtRequestConfig<O> = {
        url,
        method,
        onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
          // eslint-disable-next-line no-underscore-dangle
          console.log('onDownloadProgress', tempParams.__reqid__, progressEvent.progress, progressEvent);

          cfg.customOptions?.onDownloadProgress?.(progressEvent.progress || 0);
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          // eslint-disable-next-line no-underscore-dangle
          console.log('onUploadProgress', tempParams.__reqid__, progressEvent.progress, progressEvent);
          cfg.customOptions?.onUploadProgress?.(progressEvent.progress || 0);
        },
        // data: { aaa: 111 },
        customOptions: requestOptions
      } as any;
      Object.assign(cfg.customOptions, tempParams);
      if (method.toUpperCase() === 'GET') {
        cfg.params = {
          ...(params || {}),
          ...tempParams
        };
      } else {
        cfg.params = params;
      }
      // 注册取消请求逻辑

      const cancelController = new AbortController();
      // eslint-disable-next-line no-underscore-dangle
      this.cancalControllerMap[tempParams.__reqid__] = cancelController;
      cfg.signal = cancelController.signal;
      if (requestOptions?.cancelFnRef) {
        cfg.customOptions.cancelFnRef!.value = () => {
          // eslint-disable-next-line no-underscore-dangle
          console.log('call cancelfn reqid', tempParams.__reqid__);
          cancelController?.abort();
        };
      }

      const pe = this.axiosInstace.request<D, AxiosResponse<IResponseData<D>>>(cfg);
      console.log('promise', pe);
      Promise.all([pe])
        .then(resp => {
          resolve(resp.shift() as D | IResponseData<D>);
        })
        .catch(e => {
          reject(e);
        });
    });
  }
}
