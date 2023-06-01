import { test, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import { mockWindowsMessaging, wrapWindowsScripts } from '@duckduckgo/messaging/lib/test-utils.mjs'

test('Harmful APIs protections', async ({ page }) => {
    const perms = new HarmfulApisSpec(page)
    await perms.enabled()
    // note that if protections are disabled, the browser will show a device selection pop-up, which will never be dismissed
    const results = await page.evaluate(() => {
        // @ts-expect-error - this is added by the test framework
        return window.results['Harmful APIs']
    })

    for (const result of results) {
        expect(result.result).toEqual(result.expected)
    }
})

export class HarmfulApisSpec {
    htmlPage = '/harmful-apis/index.html'
    config = './integration-test/test-pages/harmful-apis/config/apis.json'
    build = './build/windows/contentScope.js'
    /**
     * @param {import("@playwright/test").Page} page
     */
    constructor (page) {
        this.page = page
    }

    async enabled () {
        await this.installPolyfills()
        const config = JSON.parse(readFileSync(this.config, 'utf8'))
        await this.setup({ config })
        await this.page.goto(this.htmlPage)
        for (const button of await this.page.getByTestId('user-gesture-button').all()) {
            await button.click()
        }
        await this.page.getByTestId('render-results').click()
    }

    /**
     * In CI, the global objects such as USB might not be installed on the
     * version of chromium running there.
     */
    async installPolyfills () {
        await this.page.addInitScript(() => {
            // @ts-expect-error - testing
            if (typeof Bluetooth === 'undefined') {
                globalThis.Bluetooth = {}
                globalThis.Bluetooth.prototype = { requestDevice: async () => { /* noop */ } }
            }
            // @ts-expect-error - testing
            if (typeof USB === 'undefined') {
                globalThis.USB = {}
                globalThis.USB.prototype = { requestDevice: async () => { /* noop */ } }
            }

            // @ts-expect-error - testing
            if (typeof Serial === 'undefined') {
                globalThis.Serial = {}
                globalThis.Serial.prototype = { requestPort: async () => { /* noop */ } }
            }
            // @ts-expect-error - testing
            if (typeof HID === 'undefined') {
                globalThis.HID = {}
                globalThis.HID.prototype = { requestDevice: async () => { /* noop */ } }
            }
        })
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
