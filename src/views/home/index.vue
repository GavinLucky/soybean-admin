<script setup lang="ts">
import { createAxios } from '@sa/request';
import { ref } from 'vue';
import type { UploadFileInfo } from 'naive-ui';
import type { AxiosError, AxiosResponse } from 'axios';
import type { IResponseData } from '~/packages/request/src/axios/type/type';

export type IUserReqOptions = {
  // Interface address, use the default apiUrl if you leave it blank
  apiUrl?: string;
  /** 签名忽略字段列表 */
  signIgnoreList?: string[];
  /** 自定义timeout时间 */
  timeout?: number;
  // 项目接口自定义前缀
  customPrefix?: string;
  // 请求错误提示
  errorTipMode?: IErrorMsgTipType;
};

type ICustomError<E> = IResponseData<E>;
export type IErrorMsgTipType = 'none' | 'modal' | 'message' | undefined;

const getHttp = createAxios<IUserReqOptions>(
  {},
  {
    onGetUserIdFn: () => {
      return 'user111';
    },
    onBeforeRequestFn: cfg => {
      return new Promise(resolve => {
        console.log('onBeforeRequestFn', cfg);
        const tempHeader = cfg.headers || {};
        cfg.headers = { ...tempHeader, 'Content-Type': 'application/octet-stream' };
        cfg.responseType = 'blob';
        resolve(cfg);
      });
    },
    onAfterRequestSuccess: responseData => {
      return new Promise(resolve => {
        console.log('onAfterRequestSuccess', responseData);
        resolve(cfg);
      });
    },
    onAfterRequestFailed: responseData => {
      return new Promise(resolve => {
        console.log('onAfterRequestFailed', responseData);
        resolve(responseData);
      });
    }
  }
);
const postHttp = createAxios<IUserReqOptions, ICustomError<any>>(
  {},
  {
    onBeforeRequestFn: cfg => {
      return new Promise(resolve => {
        console.log('onBeforeRequestFn postHttp', cfg);
        cfg.baseURL = 'http://47.251.59.112:8023';
        cfg.headers = {
          ...(cfg.headers || {}),
          'Login-Token': 'nologin',
          Project: '__nonEmpty',
          Platform: 'pc',
          'Content-Type': 'application/x-www-form-urlencoded'
        } as any;
        // cfg.customOptions.timeout
        // cfg.customOptions.apiUrl
        // cfg.customOptions.errorTipMode
        resolve(cfg);
      });
    },
    onAfterRequestSuccess: responseData => {
      return new Promise((resolve: AxiosResponse<any, any>, reject) => {
        console.log('onAfterRequestSuccess', responseData);
        const respData = responseData.data;
        if (respData.retCode === 0) {
          resolve(respData.data);
        } else {
          reject(new Error('server error', respData));
        }
      });
    },
    onAfterRequestFailed: (responseErr: AxiosError<ICustomError<any>>) => {
      return new Promise(resolve => {
        console.log('onAfterRequestFailed', responseData);
        const dataError = responseErr.response?.data;

        resolve(responseData);
      });
    }
  }
);

const cancalFnRef = ref<(() => void) | undefined>(undefined);

let url =
  'https://bi-base-data.oss-us-west-1.aliyuncs.com/rg_admin%2Ftemp%2Fday%3D20231123%2F8f42d14a4c2614aa9acfb205d4b42c49.csv?Expires=1700712788&OSSAccessKeyId=LTAI5tQSpxrfJtR1KDsNZwxh&Signature=PzpF4ZlJacqWIRUvgl2p%2FqZyRoY%3D';
url = 'https://bi-material-centerus.oss-us-west-1.aliyuncs.com/tmp/img/7298252056170233875.mp4_RKzRjre73H.mp4';

const percentageRef = ref(0);
const downloadOptions = {
  cancelFnRef: cancalFnRef,
  onDownloadProgress: (progress: number) => {
    percentageRef.value = parseInt(`${progress * 100}`, 10);
  }
};
const downloadBtn = () => {
  for (let i = 0; i < 1; i++) {
    getHttp
      .doRequest(`${url}`, 'get', undefined, downloadOptions)
      .then(resp => {
        console.log(resp);
      })
      .catch(e => {
        console.log('get http error', e);
      });
  }
};

const loginData1 = {
  timestamp: '1678439164',
  sign: 'c64dabb37434b552f755e32bed277542',
  account: 'wangzhen',
  password: 'wangzhen'
};
const loginData2 = {
  timestamp: '1700640029',
  sign: 'd92f44169e0f9aa94eec03d830b2bb98',
  account: 'biadmin9527',
  password: 'rg123456711'
};

const postTestFn = () => {
  postHttp
    .doRequest<{
      login_token: string;
      account: string;
      user_id: string;
      project: string;
    }>('/admin/site/login', 'post', loginData2, { cancelFnRef: cancalFnRef })
    .then(resp => {
      console.log('post res', resp);
    })
    .catch(e => {
      console.log('post res error', e);
    });
};

const cancelFn = () => {
  console.log('click cancel');
  cancalFnRef.value?.();
};

// upload
const uploadHttp = createAxios<IUserReqOptions>(
  {},
  {
    onBeforeRequestFn: cfg => {
      return new Promise(resolve => {
        console.log('onBeforeRequestFn uploadHttp', cfg);
        cfg.baseURL = 'http://47.88.34.11:8023';
        cfg.headers = {
          ...(cfg.headers || {}),
          'Login-Token': 'nologin',
          Project: '__nonEmpty',
          Platform: 'pc',
          'Content-Type': 'multipart/form-data'
        } as any;
        cfg.timeout = 10 * 60 * 1000;
        resolve(cfg);
      });
    },
    onAfterRequestSuccess: responseData => {
      return new Promise(resolve => {
        console.log('onAfterRequestSuccess', responseData);
        resolve(cfg);
      });
    },
    onAfterRequestFailed: responseData => {
      return new Promise(resolve => {
        console.log('onAfterRequestFailed', responseData);
        resolve(responseData);
      });
    }
  }
);

const chooseFileList: any[] = [];
const handleChange = (chooseValue: { file: UploadFileInfo; fileList: UploadFileInfo[] }) => {
  console.log('handleChange', chooseValue);
  chooseFileList.push(chooseValue.file);
};

const uploadOptions = {
  cancelFnRef: cancalFnRef,
  // onDownloadProgress: (progress: number) => {
  //   percentageRef.value = parseInt(`${progress * 100}`, 10);
  // },
  onUploadProgress: (progress: number) => {
    percentageRef.value = parseInt(`${progress * 100}`, 10);
  }
};
const doUploadFn = () => {
  const file = chooseFileList[0];
  const name = file.file.name;
  const type = file.file.type;
  const blobFile = file.file;
  for (let i = 0; i < 1; i++) {
    uploadHttp
      .doRequest(
        '/admin/temp/img-upload',
        'post',
        {
          name,
          type,
          file: blobFile,
          ext: 'mp4'
        },
        uploadOptions
      )
      .then(resp => {
        console.log('post res', resp);
      })
      .catch(e => {
        console.log('post res error', e);
      });
  }
};
</script>

<template>
  <div>
    <div>
      <n-button @click="downloadBtn">下载</n-button>
      <n-progress v-if="percentageRef > 0" class="w-30px text-[11px]" type="circle" :percentage="percentageRef" />
      <br />
      <n-button @click="postTestFn">Post测试</n-button>
    </div>
    <div>
      <n-button @click="cancelFn">取消</n-button>
    </div>
    <div>
      <n-upload ref="upload" :default-upload="false" multiple @change="handleChange">
        <n-button>选择文件</n-button>
      </n-upload>
      <n-button @click="doUploadFn">上传</n-button>
    </div>
  </div>
</template>

<style scoped></style>
