import { createApp } from 'vue'
import { ipcRenderer } from 'electron'
import App from './views/App.vue'
import Home from './views/pages/Home.vue'
import HomeEdit from './views/pages/HomeEdit.vue'
import LessonEdit from './views/pages/LessonEdit.vue'
import LessonShow from './views/pages/LessonShow.vue'
import NotFound from './views/pages/NotFound.vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import FullScreenController from './controllers/FullScreenController'
import "./app.css"
import { Node } from './models/Node'

// 检测全屏状态
ipcRenderer.on('main-process-message', (_event, ...args) => {
  if (args[0] === 'enter-full-screen') {
    FullScreenController.enter()
  }

  if (args[0] === 'leave-full-screen') {
    FullScreenController.leave()
  }
})

// 定义路由
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
    {
      path: '/',
      children: [
        { path: '/', component: Home, name: "home.show" },
        { path: '/edit', component: HomeEdit, name: "home.edit" }
      ]
    },
    {
      path: '/lessons/:id',
      children: [
        { path: 'edit', component: LessonEdit, name: "lessons.edit" },
        { path: 'show', component: LessonShow, name: "lessons.show" },
      ]
    },
  ],
})

router.beforeEach(function (to, from) {
  console.log("从", from.fullPath, "到", to.fullPath)

  // 如果不是page，跳转到第一个page子节点
  if (to.name == 'lessons.show') {
    let node = Node.find(parseInt(to.params.id.toString()))
    if (!node.isPage) {
      return {
        name: "lessons.show",
        params: { id: node.getFirstPage().id }
      }
    }
  }

  // 如果是编辑模式
  if (from.name == 'lessons.edit' && to.name == 'lessons.show' && from.params.id != to.params.id) {
    return {
      name: "lessons.edit",
      params: { id: to.params.id }
    }
  }
})

const app = createApp(App)
app.config.unwrapInjectedRef = true
app.use(router)
app.mount('#app')