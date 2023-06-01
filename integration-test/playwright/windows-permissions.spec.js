import { test, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import { mockWindowsMessaging, wrapWindowsScripts } from '@duckduckgo/messaging/lib/test-utils.mjs'

test('Windows Permissions Usage', async ({ page }) => {
    const perms = new WindowsPermissionsSpec(page)
    await perms.enabled()
    const results = await page.evaluate(() => {
        // @ts-expect-error - this is added by the test framework
        return window.results['Disabled Windows Permissions']
    })

    for (const result of results) {
        expect(result.result).toEqual(result.expected)
    }
})

export class WindowsPermissionsSpec {
    htmlPage = '/permissions/index.html'
    config = './integration-test/test-pages/permissions/config/permissions.json'
    build = './build/windows/contentScope.js'
    /**
     * @param {import("@playwright/test").Page} page
     */
    constructor (page) {
        this.page = page
    }

    async enabled () {
        const config = JSON.parse(readFileSync(this.config, 'utf8'))
        await this.setup({ config })
        await this.page.goto(this.htmlPage)
    }

    /**
     * @param {object} params
     * @param {Record<string, any>} params.config
     * @return {Promise<void>}
     */
    async setup (params) {
        const { config } = params

        // read the built file from disk and do replacements
        const injectedJS = wrapWindowsScripts(this.buildArtefact, {
            $CONTENT_SCOPE$: config,
            $USER_UNPROTECTED_DOMAINS$: [],
            $USER_PREFERENCES$: {
                platform: { name: 'windows' },
                debug: true
            }
        })

        await this.page.addInitScript(mockWindowsMessaging, {
            messagingContext: {
                env: 'development',
                context: 'contentScopeScripts',
                featureName: 'n/a'
            },
            responses: {}
        })

        // attach the JS
        await this.page.addInitScript(injectedJS)
    }

    /**
     * @return {string}
     */
    get buildArtefact () {
        const buildArtefact = readFileSync(this.build, 'utf8')
        return buildArtefact
    }
}
