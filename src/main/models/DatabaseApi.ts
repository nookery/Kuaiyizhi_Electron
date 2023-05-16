import { join } from "path";
import Config from "../config";
import log from "../logger";
import { writeFile } from "fs";

interface TreeNodeObject {
    id: number 
    title: string 
    isBook: boolean 
    isChapter: boolean 
    isTab: boolean 
    isPage: boolean 
    isLesson: boolean 
    isManual: boolean 
    isVisible: boolean 
    priority: number 
    parentId: number 
    level: number 
    isEmpty: boolean 
    cover: string 
    content: string 
    tree: string 
}

const EmptyNode: TreeNodeObject= {
    id: 0,
    title: '',
    isBook: false,
    isChapter: false,
    isTab: false,
    isPage: false,
    isLesson: true,
    isManual: false,
    isVisible: true,
    priority: 0,
    parentId: 0,
    level: 0,
    isEmpty: true,
    cover: '',
    content: '',
    tree: ''
}

class DatabaseApi {
    protected dbFilePath: string | undefined = join(Config.DATABASE_PATH, 'xxxx.db')
    protected connection!: any;

    constructor(dbFilePath?: string) {
        this.dbFilePath = dbFilePath
        this.connection = require('better-sqlite3')(dbFilePath)
    }

    delete(id: number): string {
        this.connection.prepare('delete from nodes where id=?').run(id)
        return "已删除「" + id + "」"
    }

    find(id: number): TreeNodeObject|null {
        log.debug(`在 ${this.dbFilePath} 中查找节点 id=${id}`)

        if (id == undefined) {
            log.error('被查找的节点不能为undefined')
            return null
        }

        if (id <= 0) return EmptyNode

        let result = this.connection.prepare('select * from nodes where id=?').get(id)

        return result
    }

    getRoot(): TreeNodeObject {
        log.debug('get root,connection is', this.connection)

        let result = this.connection.prepare('select * from nodes where parent_id=0 order by priority asc limit 1').get()

        log.debug('root', result.title)
        return result
    }

    getChildren(id: number): TreeNodeObject[] {
        let children = this.connection.prepare('select * from nodes where parent_id=? order by priority asc').all(id)

        log.info(`get children of ${id},count=${children.length}`)

        return children
    }

    getBooks(): TreeNodeObject[] {
        let items = this.connection.prepare('select * from nodes where is_book=1 order by priority asc').all()

        return items
    }

    getFirstBook(): TreeNodeObject {
        let result = this.connection.prepare('select * from nodes where is_book=1 order by priority asc limit 1').get()

        log.debug('get first book', result)
        return result
    }

    getFirstPage(id: number): TreeNodeObject {
        let current = this.find(id)
        if (current!.isPage || current!.isEmpty) return current!

        let firstChild = this.getFirstChild(id)

        if (firstChild) {
            return this.getFirstPage(firstChild.id)
        }

        return EmptyNode
    }

    getFirstChild(id: number): TreeNodeObject|null {
        let child = this.connection.prepare('select * from nodes where parent_id=? order by priority asc limit 1').get(id)

        log.info(`get first child of ${id}`)

        return child
    }

    getVisibleBooks(): TreeNodeObject[] {
        let items = this.connection.prepare('select * from nodes where is_book=1 and is_visible=1 order by priority asc').all()

        return items
    }

    search(keyword: string): TreeNodeObject[] {
        log.info('搜索', keyword)
        let nodes = this.connection.prepare("select * from nodes where title like ? limit 5").all(`%${keyword}%`)
        return nodes
    }

    updateTitle(id: number, title: string): string {
        let result = this.connection.prepare('update nodes set title=? where id=?').run(title, id)
        if (result != null) {
            return '「' + id + '」的标题更新成功'
        } else {
            return '「' + id + '」的标题更新失败'
        }
    }

    updatePriority(id: number, priority: number) {
        log.info(id, '更新priority为', priority)
        this.connection.prepare('update nodes set priority=? where id=?').run(priority, id)
    }

    updateContent(id: number, content: string): string {
        let result = this.connection.prepare('update nodes set content=? where id=?').run(content, id)
        writeFile(join(Config.DATABASE_PATH, 'html', id + '.html'), content, (err) => {
            log.info('已同步到磁盘', err)
        })

        if (result != null) {
            return '「' + id + '」的内容更新成功'
        } else {
            return '「' + id + '」的内容更新失败'
        }
    }

    updateCover(id: number, base64Code: string): string {
        let result = this.connection.prepare('update nodes set cover=? where id=?').run(base64Code, id)
        if (result != null) {
            return id + '的封面更新成功'
        } else {
            return id + '的封面更新失败'
        }
    }

    updateVisible(id: number, visible: boolean): string {
        let result = this.connection.prepare('update nodes set is_visible=? where id=?').run(visible, id)
        if (result != null) {
            return '「' + id + '」已更新可见性'
        } else {
            return '「' + id + '」的可见性更新失败'
        }
    }
}

export default DatabaseApi