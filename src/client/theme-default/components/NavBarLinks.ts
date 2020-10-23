import { computed } from 'vue'
import { useSiteData, useSiteDataByRoute, useRoute } from 'vitepress'
import NavBarLink from './NavBarLink.vue'
import NavDropdownLink from './NavDropdownLink.vue'
import { DefaultTheme } from '../config'
import { inBrowser } from '/@app/utils'

const platforms = ['GitHub', 'GitLab', 'Bitbucket'].map(
  (platform) => [platform, new RegExp(platform, 'i')] as const
)

export default {
  components: {
    NavBarLink,
    NavDropdownLink
  },

  setup() {
    const siteDataByRoute = useSiteDataByRoute()
    const siteData = useSiteData()
    const route = useRoute()
    const repoInfo = computed(() => {
      const theme = siteData.value.themeConfig as DefaultTheme.Config
      const repo = theme.docsRepo || theme.repo
      let text: string | undefined = theme.repoLabel

      if (repo) {
        const link = /^https?:/.test(repo) ? repo : `https://github.com/${repo}`
        if (!text) {
          // if no label is provided, deduce it from the repo url
          const repoHosts = link.match(/^https?:\/\/[^/]+/)
          if (repoHosts) {
            const repoHost = repoHosts[0]
            const foundPlatform = platforms.find(([_platform, re]) =>
              re.test(repoHost)
            )
            text = foundPlatform && foundPlatform[0]
          }
        }

        return { link, text: text || 'Source' }
      }
      return null
    })

    const localeCandidates = computed(() => {
      const locales = siteData.value.themeConfig.locales
      if (!locales) {
        return null
      }
      const localeKeys = Object.keys(locales)
      if (localeKeys.length <= 1) {
        return null
      }

      // index.html
      const base = siteData.value.base.endsWith('/')
        ? siteData.value.base.slice(0, -1)
        : siteData.value.base

      // inBrowser router
      const routerPath = inBrowser ? route.path.slice(base.length) : route.path

      const currentLangBase = localeKeys.find((v) => {
        if (v === '/') {
          return false
        }
        return routerPath.startsWith(v)
      })
      const currentContentPath = currentLangBase
        ? routerPath.substring(currentLangBase.length - 1)
        : routerPath
      const candidates = localeKeys.map((v) => {
        return {
          text: locales[v].label || locales[v].lang,
          link: `${v.slice(0, -1)}${currentContentPath}`
        }
      })
      console.log(candidates)

      const currentLangKey = currentLangBase ? currentLangBase : '/'
      const selectText = locales[currentLangKey].selectText
        ? locales[currentLangKey].selectText
        : 'Languages'
      return {
        text: selectText,
        items: candidates
      }
    })

    return {
      navData:
        process.env.NODE_ENV === 'production'
          ? // navbar items do not change in production
            siteDataByRoute.value.themeConfig.nav
          : // use computed in dev for hot reload
            computed(() => siteDataByRoute.value.themeConfig.nav),
      repoInfo,
      localeCandidates
    }
  }
}
