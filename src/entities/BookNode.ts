import fs from "fs"
import path from "path"
import Id from "./Id";
import RouteController from "../controllers/RouteController";
import FileTree from "../tools/FileTree";
import Config from "./Config";
import BookNodeModel from "../models/BookNode"
import { writeFileSync } from "fs";
import { writeFile } from "fs";
import { mkdirSync } from "fs";
import { existsSync } from "fs";

class BookNode {
    public path: string = ''
    public name: string = ''
    public id: string = ''
    public level: number = 0
    public errorTitle: string = ''
    public errorLines: string[] = []
    public db: BookNodeModel = new BookNodeModel

    public constructor(absolutePath?: string) {
        if (absolutePath != undefined) {
            // console.log('初始化图书节点', absolutePath)

            if (!fs.existsSync(absolutePath)) {
                this.errorTitle = '文件或目录不存在'
                this.errorLines.push(absolutePath)
            }

            if (BookNode.shouldIgnore(absolutePath)) {
                this.errorTitle = '该节点应该被忽略'
                this.errorLines.push(absolutePath)
            }

            this.path = absolutePath
            this.name = path.basename(this.path).replace('.html', '').replace('[TAB]', '')
            this.id = Id.pathToId(this.path)
            this.level = this.id.split('@').length

            BookNodeModel.sync(this)
        } else {
            this.errorTitle = '当前节点为空节点'
        }
    }

    public createChild(name: string): BookNode | string {
        let childPath = path.join(this.path, name + '.html')

        if (existsSync(childPath)) {
            return '同名节点已经存在，不能创建'
        }

        writeFileSync(childPath, name)
        return new BookNode(childPath)
    }

    public createFolderChild(name: string): BookNode | string {
        let childPath = path.join(this.path, name)

        if (existsSync(childPath)) {
            return '同名节点已经存在，不能创建'
        }

        mkdirSync(childPath)
        let child = new BookNode(childPath)
        child.createChild('__空__.html')

        return child
    }

    public getManuals(): BookNode[] {
        let manualsPath = path.join(this.path, 'manuals')
        console.log('获取操作手册', manualsPath)
        return (new BookNode(manualsPath)).getChildren()
    }

    public getChildById(id: string): BookNode {
        return new BookNode(Id.idToPath(id))
    }

    public isEmpty(): boolean {
        return this.hasError()
    }

    public isPage(): boolean {
        return this.isEmpty() || fs.statSync(this.path).isFile()
    }

    public isTab(): boolean {
        return path.basename(this.path).startsWith('[TAB]')
    }

    public isChapter(): boolean {
        return !this.isPage() && !this.isBook()
    }

    public isLesson(): boolean {
        return !this.isManual()
    }

    public isManual(): boolean {
        if (this.isEmpty()) return false

        return this.name == '手册' ? true : this.getParent().isManual()
    }

    public isRoot(): boolean {
        return this.id == '/'
    }

    public logo(): string {
        return path.join(Config.imagesPath, this.name + '-logo.png')
    }

    public logoUrl(): string {
        return this.logo().replace(Config.publicPath, '')
    }

    public hasLogo(): boolean {
        return existsSync(this.logo())
    }

    public getChildren(): BookNode[] {
        return this.getChildrenIds().map((childId: string) => {
            return new BookNode(Id.idToPath(childId))
        });
    }

    public firstChild(): BookNode {
        let childrenIds = this.getChildrenIds()
        let firstChildId = childrenIds.at(0)

        if (firstChildId == undefined) {
            return new BookNode
        }

        return new BookNode(Id.idToPath(firstChildId))
    }

    public getChildrenIds(): string[] {
        if (this.isPage()) return []

        let config = Config.get('children_settings:' + this.id)

        // 从文件系统读取children，然后根据配置文件确定排序
        let children = fs.readdirSync(this.path).filter(child => {
            return !Config.get('nodeExcepts').includes(child)
        }).map(child => {
            let id = Id.pathToId(path.join(this.path, child))
            if (config == undefined) {
                return '000' + id
            }
            return config.indexOf(id).toString().padStart(3, '0') + id
        }).sort().map(child => {
            return child.slice(3)
        })

        if (JSON.stringify(children) != JSON.stringify(config)) {
            console.log('从文件系统获取的children和从配置文件获取的children不相等，更新配置文件')
            this.setChildrenConfig(children)
        }

        return children
    }

    public setChildrenConfig(children: string[]) {
        Config.set('children_settings:' + this.id, children)
    }

    public isBook(): boolean {
        return path.dirname(this.path) == Config.markdownRootPath
    }

    public siblings(): BookNode[] {
        // console.log('get siblings', this.id)
        return this.getParent().getChildren().filter(child => {
            return child.id != this.id
        })
    }

    public siblingsWithCurrent(): BookNode[] {
        return this.getParent().getChildren()
    }

    public getParent(): BookNode {
        if (this.isEmpty() || this.isRoot()) return new BookNode

        let dir = path.dirname(this.path)

        return new BookNode(dir)
    }

    public getParents(): BookNode[] {
        if (this.isEmpty()) return []

        let parents = (new FileTree(this.path)).getParentsPaths(Config.markdownRootPath)

        return parents.map(parent => {
            return new BookNode(parent)
        }).reverse()
    }

    public getFirstChild(): BookNode {
        let children = this.getChildren()
        let first = children.at(0)

        return first == undefined ? new BookNode : first
    }

    public getBook(): BookNode {
        if (this.isEmpty()) return new BookNode

        let parent = this.getParent()

        if (parent.isBook()) return parent

        return parent.getBook()
    }

    public hasError(): boolean {
        return this.errorTitle.length > 0
    }

    public isActivated() {
        let currentPage = RouteController.getCurrentPage()
        let activatedBookNodes = currentPage.getParents()

        return activatedBookNodes.some(node => {
            return node.id == this.id
        })
    }

    public shouldActive() {
        return this.isActivated()
    }

    static shouldIgnore(absolutePath: string) {
        return Config.get('nodeExcepts').includes(path.basename(absolutePath))
    }

    // 获取源码
    public getSourceCode(): string {
        let content = fs.readFileSync(this.path).toString()
        let MarkdownIt = require('markdown-it')
        if (this.path.includes('.md')) {
            content = (new MarkdownIt).render(content)
        }

        return this.hasError() ? '' : content
    }

    public delete() {
        if (this.isPage()) {
            fs.rmSync(this.path)
        } else {
            fs.rmdirSync(this.path)
        }

        if (this.siblings().length == 0) {
            this.getParent().delete()
        }

        return '删除成功'
    }

    public firstPage(): BookNode {
        return this.isPage() ? this : this.getFirstChild().firstPage()
    }

    public prev(): BookNode | null {
        let siblingsIncludeCurrent = this.getParent().getChildren()
        for (let i = 0; i < siblingsIncludeCurrent.length; i++) {
            let current = siblingsIncludeCurrent[i]
            if (current.id == this.id && i - 1 >= 0) {
                return siblingsIncludeCurrent[i - 1]
            }
        }

        return new BookNode
    }

    public next(): BookNode {
        let siblingsIncludeCurrent = this.getParent().getChildren()
        for (let i = 0; i < siblingsIncludeCurrent.length; i++) {
            let current = siblingsIncludeCurrent[i]
            if (current.id == this.id && i + 1 < siblingsIncludeCurrent.length) {
                return siblingsIncludeCurrent[i + 1]
            }
        }

        return new BookNode
    }

    // 按照名称查找节点
    public search(name: string): BookNode[] {
        // console.log('search 「' + name + '」in ' + this.id)
        if (this.isEmpty() || this.isPage()) return []

        let result: BookNode[] = []
        let children = this.getChildren()

        children.forEach(function (child) {
            // console.log('search for name', name, 'current is', child.name)
            if (child.name == name) result.push(child)

            result = result.concat(child.search(name))
        })

        return result
    }

    // 重命名并返回重命名后的节点
    public rename(name: string): BookNode {
        if (name == this.name) return this

        let newPath = path.join(path.dirname(this.path), name + '.html')
        fs.renameSync(this.path, newPath)

        return new BookNode(newPath)
    }

    // 保存文章内容
    public save(content: string): string {
        if (this.getSourceCode() == content) {
            return '没有变化，无需保存'
        }

        writeFileSync(this.path.replace('.md', '.html'), content)

        return '保存成功'
    }
}

export default BookNode