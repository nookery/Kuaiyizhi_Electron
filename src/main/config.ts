import { app } from 'electron'
import path from 'path'

const ROOT_PATH = path.join(__dirname, '../..')
const DIST_PATH = path.join(__dirname, '../..')
const PUBLIC_PATH = path.join(__dirname, app.isPackaged ? '../..' : '../../../public')
const PRELOAD_FILE = path.join(__dirname, '../preload/index.js')
const URL = process.env.VITE_DEV_SERVER_URL as string
const INDEX_HTML_PATH = path.join(DIST_PATH, 'src/ui/index.html')
const DATABASE_PATH = path.join(ROOT_PATH, 'database')

const Config = {
    ROOT_PATH,
    DIST_PATH,
    PUBLIC_PATH,
    PRELOAD_FILE,
    URL,
    DATABASE_PATH,
    INDEX_HTML_PATH
}

export default Config