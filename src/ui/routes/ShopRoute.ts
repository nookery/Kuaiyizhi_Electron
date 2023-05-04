import Lesson from '../pages/Lesson.vue'
import ShopHome from '../pages/ShopHome.vue'
import { RouteRecordRaw } from 'vue-router'

const shopRoutes: RouteRecordRaw = {
    path: '/shop',
    children: [
        {
            path: '', component: ShopHome,
            name: "shop.home.show"
        },
        {
            path: 'edit', component: ShopHome,
            name: "shop.home.edit"
        },
        {
            path: 'lessons/:id',
            children: [
                {
                    path: 'edit',
                    component: Lesson,
                    name: "shop.lessons.edit"
                },
                {
                    path: 'show',
                    component: Lesson,
                    name: "shop.lessons.show"
                },
            ]
        }
    ]
}

export default shopRoutes