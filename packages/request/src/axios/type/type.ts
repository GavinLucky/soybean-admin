import type { Ref } from 'vue';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { AxiosError } from 'axios/index';

export type IExtRequestConfig<O = any> = InternalAxiosRequestConfig<any> & {
  customOptions: IRequestOptions<O>;
};

export type IResponseData<D = any> = {
  retCode: number;
  retMsg: string;
  data?: D;
};

export type ICreatOptions<O, E> = {
  /** 表示后端请求状态码的属性字段 */
  codeKey?: string;
  /** 表示后端请求数据的属性字段 */
  dataKey?: string;
  /** 表示后端消息的属性字段 */
  msgKey?: string;
  /** 获取用户标识 */
  onGetUserIdFn?: () => string;
  /** 发起请求之前 */
  onBeforeRequestFn?: (config: IExtRequestConfig<O>) => Promise<IExtRequestConfig>;
  /** 请求成功回调 */
  onAfterRequestSuccess?: (response: AxiosResponse<IResponseData, any>) => Promise<IResponseData>;
  /** 请求失败回调 */
  onAfterRequestFailed?: (responseErr: AxiosError<E>) => Promise<E>;
};
export type IRequestOptions<O = Record<string, unknown>> = {
  [P in keyof O]?: O[P];
} & {
  readonly __reqid__?: string;

  cancelFnRef: undefined | Ref<undefined | (() => void)>;

  onDownloadProgress?: (progress: number) => void;
  onUploadProgress?: (progress: number) => void;
};
