import type { AxiosRequestConfig } from 'axios';
import { AxiosRequest } from './inner/axiosIndex';
import type { ICreatOptions, IResponseData } from './type/type';

// export function createAxios(config?: CreateAxiosDefaults) {
//   const instance = axios.create(config);
//
//   return instance;
// }

// export default createAxios;

export function createAxios<O = any, E = any>(cfg1: AxiosRequestConfig, cfg2: ICreatOptions<O, E>) {
  return new AxiosRequest<O, E>(cfg1, cfg2);
}
