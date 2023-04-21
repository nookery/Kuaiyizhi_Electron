import { BrowserWindow, MenuItem } from "electron"

const __DARWIN__ = process.platform === 'darwin'

function getViewMenu(win: BrowserWindow) {
    return new MenuItem({
        label: __DARWIN__ ? '视图' : '&View',
        submenu: [
            {
                label: '切换全屏',
                role: 'togglefullscreen',
            },
            {
                label: "最小化",
                role: 'minimize',
            },
            {
                label: "关闭",
                role: 'close',
            },
            {
                label: "重新加载",
                role: 'reload',
            },

            { type: 'separator' },
            { label: "放大", role: "zoomIn" },
            { label: "缩小", role: "zoomOut" },
            { label: "重置", role: "resetZoom" },

            { type: 'separator' },
            {
                label: '搜索',
                accelerator: 'CommandOrControl+K',
                click: () => {
                    win.webContents.send('main-process-message', 'toggle-search')
                }
            },
            {
                label: '切换开发者视图',
                role: "toggleDevTools",
            },
        ],
    })
}

export default getViewMenu