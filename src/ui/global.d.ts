import { IpcRenderer } from "electron";

export declare global {
    interface Window {
        // 在preload中定义的用于和主进程通信的方法
        ipcRender: IpcRenderer,
        listen,
        api: {
            versions,
        };
    }
}

// 这个函数是在vendor/monaco-editor/min/vs/loader.js中定义的
// monaco github 上的例子是用这个函数加载的
export declare function require(str: Array, cb: (n?: number) => void): void;