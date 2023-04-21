import { BrowserWindow, MenuItem, app } from "electron"
import { indexHtml,url } from "../config"

export default new MenuItem({
    label: '快易知',
    submenu: [
        {
            label: '关于',
            role:'about',
        },
        {
            label: '版本详情',
            click:()=> {
                const win = new BrowserWindow({
                    width: 400, height: 300, webPreferences: {
                        nodeIntegration: true,
                        contextIsolation: false,
                        spellcheck: false,
                    },
                })
                if (app.isPackaged) {
                    win.loadFile(indexHtml, { hash: '/about' })
                } else {
                    win.loadURL(url + '#about')
                }
            }
        },
        { type: 'separator' }, 
        {
            role: 'services',
            label:'服务',
            submenu: [],
        },
        { type: 'separator' }, 
        {
            role: 'hide',
            label: '隐藏'
        },
        {
            role: 'hideOthers',
            label:"隐藏其他程序"
        },
        { role: 'unhide' },
        { type: 'separator' },
        {
            role: 'quit',
            label: "退出"
        }
    ]
})