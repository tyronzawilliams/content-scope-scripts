import { useTypedTranslationWith } from '../../types.js';
import { useState } from 'preact/hooks';
import styles from './PrivacyStats.module.css';
import { ShowHideButtonCircle } from '../../components/ShowHideButton.jsx';
import cn from 'classnames';
import { h } from 'preact';
import { Trans } from '../../../../../shared/components/TranslationsProvider.js';
import { useAdBlocking } from '../../settings.provider.js';

/**
 * @import enStrings from "../strings.json"
 * @import activityStrings from "../../activity/strings.json"
 * @typedef {enStrings & activityStrings} Strings
 * @param {object} props
 * @param {import('../../../types/new-tab.js').Expansion} props.expansion
 * @param {number} props.trackerCount
 * @param {number} props.itemCount
 * @param {boolean} props.canExpand
 * @param {() => void} props.onToggle
 * @param {import('preact').ComponentProps<'button'>} [props.buttonAttrs]
 */
export function ActivityHeading({ expansion, canExpand, itemCount, trackerCount, onToggle, buttonAttrs = {} }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const [formatter] = useState(() => new Intl.NumberFormat());
    const adBlocking = useAdBlocking();

    const none = itemCount === 0;
    const someItems = itemCount > 0;
    const trackerCountFormatted = formatter.format(trackerCount);

    let allTimeString;
    if (trackerCount === 1) {
        allTimeString = adBlocking ? t('stats_countBlockedAdsAndTrackersSingular') : t('stats_countBlockedSingular');
    } else {
        allTimeString = adBlocking
            ? t('stats_countBlockedAdsAndTrackersPlural', { count: trackerCountFormatted })
            : t('stats_countBlockedPlural', { count: trackerCountFormatted });
    }

    return (
        <div
            className={cn(styles.heading, styles.activityVariant, { [styles.adsAndTrackersVariant]: adBlocking })}
            data-testid={'ActivityHeading'}
        >
            <span className={styles.headingIcon}>
                <img src={adBlocking ? './icons/shield-green.svg' : './icons/shield.svg'} alt="Privacy Shield" />
            </span>
            {none && <h2 className={styles.title}>{t('activity_noRecent_title')}</h2>}
            {someItems && (
                <h2 className={styles.title}>
                    <Trans str={allTimeString} values={{ count: trackerCountFormatted }} />
                </h2>
            )}
            {canExpand && (
                <span className={styles.widgetExpander}>
                    <ShowHideButtonCircle
                        buttonAttrs={{
                            ...buttonAttrs,
                            'aria-expanded': expansion === 'expanded',
                            'aria-pressed': expansion === 'expanded',
                        }}
                        onClick={onToggle}
                        label={expansion === 'expanded' ? t('stats_hideLabel') : t('stats_toggleLabel')}
                    />
                </span>
            )}
            {itemCount === 0 && (
                <p className={cn(styles.subtitle, { [styles.indented]: !adBlocking })}>
                    {adBlocking ? t('activity_noRecentAdsAndTrackers_subtitle') : t('activity_noRecent_subtitle')}
                </p>
            )}
            {itemCount > 0 && (
                <p className={cn(styles.subtitle, styles.indented, { [styles.uppercase]: !adBlocking })}>
                    {t('stats_feedCountBlockedPeriod')}
                </p>
            )}
        </div>
    );
}
