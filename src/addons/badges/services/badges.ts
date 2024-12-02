// (C) Copyright 2015 Moodle Pty Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Injectable } from '@angular/core';
import { CoreSites } from '@services/sites';
import { CoreWSExternalWarning } from '@services/ws';
import { makeSingleton } from '@singletons';
import { CoreError } from '@classes/errors/error';
import { CoreCacheUpdateFrequency } from '@/core/constants';

const ROOT_CACHE_KEY = 'mmaBadges:';

/**
 * Service to handle badges.
 */
@Injectable({ providedIn: 'root' })
export class AddonBadgesProvider {

    /**
     * Returns whether or not the badge plugin is enabled for a certain site.
     *
     * This method is called quite often and thus should only perform a quick
     * check, we should not be calling WS from here.
     *
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved with true if enabled, false otherwise.
     */
    async isPluginEnabled(siteId?: string): Promise<boolean> {
        const site = await CoreSites.getSite(siteId);

        return site.canUseAdvancedFeature('enablebadges');
    }

    /**
     * Get the cache key for the get badges call.
     *
     * @param courseId ID of the course to get the badges from.
     * @param userId ID of the user to get the badges from.
     * @returns Cache key.
     */
    protected getBadgesCacheKey(courseId: number, userId: number): string {
        return ROOT_CACHE_KEY + 'badges:' + courseId + ':' + userId;
    }

    /**
     * Get issued badges for a certain user in a course.
     *
     * @param courseId ID of the course to get the badges from.
     * @param userId ID of the user to get the badges from.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise to be resolved when the badges are retrieved.
     */
    async getUserBadges(courseId: number, userId: number, siteId?: string): Promise<AddonBadgesUserBadge[]> {

        const site = await CoreSites.getSite(siteId);
        const data: AddonBadgesGetUserBadgesWSParams = {
            courseid: courseId,
            userid: userId,
        };
        const preSets = {
            cacheKey: this.getBadgesCacheKey(courseId, userId),
            updateFrequency: CoreCacheUpdateFrequency.RARELY,
        };

        const response = await site.read<AddonBadgesGetUserBadgesWSResponse>('core_badges_get_user_badges', data, preSets);
        if (!response || !response.badges) {
            throw new CoreError('Invalid badges response');
        }

        response.badges.forEach((badge) => {
            // In 3.7, competencies was renamed to alignment.
            if (!badge.alignment && badge.competencies) {
                badge.alignment = badge.competencies.map((competency) => ({
                    targetName: competency.targetname,
                    targetUrl: competency.targeturl,
                }));
            }
            badge.alignment = badge.alignment || badge.competencies;

            // Exclude alignments without targetName, we can't display them.
            badge.alignment = badge.alignment?.filter((alignment) => alignment.targetName);
        });

        return response.badges;
    }

    /**
     * Invalidate get badges WS call.
     *
     * @param courseId Course ID.
     * @param userId ID of the user to get the badges from.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved when data is invalidated.
     */
    async invalidateUserBadges(courseId: number, userId: number, siteId?: string): Promise<void> {
        const site = await CoreSites.getSite(siteId);

        await site.invalidateWsCacheForKey(this.getBadgesCacheKey(courseId, userId));
    }

    /**
     * Get the cache key for the get badge by hash WS call.
     *
     * @param hash Badge issued hash.
     * @returns Cache key.
     */
    protected getUserBadgeByHashCacheKey(hash: string): string {
        return ROOT_CACHE_KEY + 'badge:' + hash;
    }

    /**
     * Get issued badge by hash.
     *
     * @param hash Badge issued hash.
     * @returns Promise to be resolved when the badge is retrieved.
     * @since 4.5 with the recpient name, 4.3 without the recipient name.
     */
    async getUserBadgeByHash(hash: string, siteId?: string): Promise<AddonBadgesUserBadge> {
        const site = await CoreSites.getSite(siteId);
        const data: AddonBadgesGetUserBadgeByHashWSParams = {
            hash,
        };
        const preSets = {
            cacheKey: this.getUserBadgeByHashCacheKey(hash),
            updateFrequency: CoreCacheUpdateFrequency.RARELY,
        };

        const response = await site.read<AddonBadgesGetUserBadgeByHashWSResponse>(
            'core_badges_get_user_badge_by_hash',
            data,
            preSets,
        );
        const badge = response?.badge?.[0];
        if (!badge) {
            throw new CoreError('Invalid badge response');
        }

        // Exclude alignments without targetName, we can't display them.
        badge.alignment = badge.alignment?.filter((alignment) => alignment.targetName);

        return badge;
    }

    /**
     * Invalidate get badge by hash WS call.
     *
     * @param hash Badge issued hash.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved when data is invalidated.
     */
    async invalidateUserBadgeByHash(hash: string, siteId?: string): Promise<void> {
        const site = await CoreSites.getSite(siteId);

        await site.invalidateWsCacheForKey(this.getUserBadgeByHashCacheKey(hash));
    }

    /**
     * Get the cache key for the get badge class WS call.
     *
     * @param id Badge ID.
     * @returns Cache key.
     */
    protected getBadgeClassCacheKey(id: number): string {
        return ROOT_CACHE_KEY + 'badgeclass:' + id;
    }

    /**
     * Get badge class.
     *
     * @param id Badge ID.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise to be resolved when the badge is retrieved.
     * @since 4.5
     */
    async getBadgeClass(id: number, siteId?: string): Promise<AddonBadgesBadgeClass> {
        const site = await CoreSites.getSite(siteId);
        const data: AddonBadgesGetBadgeClassWSParams = {
            id,
        };
        const preSets = {
            cacheKey: this.getBadgeClassCacheKey(id),
            updateFrequency: CoreCacheUpdateFrequency.RARELY,
        };

        const response = await site.read<AddonBadgesGetBadgeClassWSResponse>(
            'core_badges_get_badge',
            data,
            preSets,
        );
        const badge = response?.badge;
        if (!badge) {
            throw new CoreError('Invalid badge response');
        }

        // Exclude alignments without targetName, we can't display them.
        badge.alignment = badge.alignment?.filter((alignment) => alignment.targetName);

        return badge;
    }

    /**
     * Invalidate get badge class WS call.
     *
     * @param id Badge ID.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved when data is invalidated.ç
     * @since 4.5
     */
    async invalidateBadgeClass(id: number, siteId?: string): Promise<void> {
        const site = await CoreSites.getSite(siteId);

        await site.invalidateWsCacheForKey(this.getBadgeClassCacheKey(id));
    }

    /**
     * Returns whether get badge class WS is available.
     *
     * @param siteId Site ID. If not defined, current site.
     * @returns If WS is available.
     */
    async isGetBadgeClassAvailable(siteId?: string): Promise<boolean> {
        const site = await CoreSites.getSite(siteId);

        return site.wsAvailable('core_badges_get_badge');
    }

}

export const AddonBadges = makeSingleton(AddonBadgesProvider);

/**
 * Params of core_badges_get_user_badges WS.
 */
type AddonBadgesGetUserBadgesWSParams = {
    userid?: number; // Badges only for this user id, empty for current user.
    courseid?: number; // Filter badges by course id, empty all the courses.
    page?: number; // The page of records to return.
    perpage?: number; // The number of records to return per page.
    search?: string; // A simple string to search for.
    onlypublic?: boolean; // Whether to return only public badges.
};

/**
 * Data returned by core_badges_get_user_badges WS.
 */
type AddonBadgesGetUserBadgesWSResponse = {
    badges: AddonBadgesUserBadge[];
    warnings?: CoreWSExternalWarning[];
};

/**
 * Result of WS core_badges_get_user_badges.
 */
export type AddonBadgesGetUserBadgesResult = {
    badges: AddonBadgesUserBadge[]; // List of badges.
    warnings?: CoreWSExternalWarning[]; // List of warnings.
};

/**
 * Badge data returned by WS core_badges_get_user_badges.
 */
export type AddonBadgesUserBadge = {
    id?: number; // Badge id.
    name: string; // Badge name.
    description: string; // Badge description.
    timecreated?: number; // Time created.
    timemodified?: number; // Time modified.
    usercreated?: number; // User created.
    usermodified?: number; // User modified.
    issuername: string; // Issuer name.
    issuerurl: string; // Issuer URL.
    issuercontact: string; // Issuer contact.
    expiredate?: number; // Expire date.
    expireperiod?: number; // Expire period.
    type?: number; // Type.
    courseid?: number; // Course id.
    coursefullname?: string; // Full name of the course.
    message?: string; // Message.
    messagesubject?: string; // Message subject.
    attachment?: number; // Attachment.
    notification?: number; // @since 3.6. Whether to notify when badge is awarded.
    nextcron?: number; // @since 3.6. Next cron.
    status?: number; // Status.
    issuedid?: number; // Issued id.
    uniquehash: string; // Unique hash.
    dateissued: number; // Date issued.
    dateexpire: number; // Date expire.
    visible?: number; // Visible.
    recipientid?: number; // @since 4.5. Id of the awarded user.
    recipientfullname?: string; // @since 4.5. Full name of the awarded user.
    email?: string; // @since 3.6. User email.
    version?: string; // @since 3.6. Version.
    language?: string; // @since 3.6. Language.
    imageauthorname?: string; // @since 3.6. Name of the image author.
    imageauthoremail?: string; // @since 3.6. Email of the image author.
    imageauthorurl?: string; // @since 3.6. URL of the image author.
    imagecaption?: string; // @since 3.6. Caption of the image.
    badgeurl: string; // Badge URL.
    endorsement?: { // @since 3.6.
        id: number; // Endorsement id.
        badgeid: number; // Badge id.
        issuername: string; // Endorsement issuer name.
        issuerurl: string; // Endorsement issuer URL.
        issueremail: string; // Endorsement issuer email.
        claimid: string; // Claim URL.
        claimcomment: string; // Claim comment.
        dateissued: number; // Date issued.
    };
    alignment?: { // @since 3.7. Calculated by the app for 3.6 sites. Badge alignments.
        id?: number; // Alignment id.
        badgeid?: number; // Badge id.
        targetName?: string; // Target name.
        targetUrl?: string; // Target URL.
        targetDescription?: string; // Target description.
        targetFramework?: string; // Target framework.
        targetCode?: string; // Target code.
    }[];
    competencies?: { // @deprecatedonmoodle since 3.7. @since 3.6. In 3.7 it was renamed to alignment.
        id?: number; // Alignment id.
        badgeid?: number; // Badge id.
        targetname?: string; // Target name.
        targeturl?: string; // Target URL.
        targetdescription?: string; // Target description.
        targetframework?: string; // Target framework.
        targetcode?: string; // Target code.
    }[];
    relatedbadges?: { // @since 3.6. Related badges.
        id: number; // Badge id.
        name: string; // Badge name.
        version?: string; // Version.
        language?: string; // Language.
        type?: number; // Type.
    }[];
};

/**
 * Params of core_badges_get_user_badge_by_hash WS.
 */
type AddonBadgesGetUserBadgeByHashWSParams = {
    hash: string; // Badge issued hash.
};

/**
 * Data returned by core_badges_get_user_badge_by_hash WS.
 */
type AddonBadgesGetUserBadgeByHashWSResponse = {
    badge: AddonBadgesUserBadge[];
    warnings?: CoreWSExternalWarning[];
};

/**
 * Params of core_badges_get_badge WS.
 */
type AddonBadgesGetBadgeClassWSParams = {
    id: number; // Badge ID.
};

/**
 * Data returned by core_badges_get_badge WS.
 */
type AddonBadgesGetBadgeClassWSResponse = {
    badge: AddonBadgesBadgeClass;
    warnings?: CoreWSExternalWarning[];
};

/**
 * Badge data returned by core_badges_get_badge WS.
 */
export type AddonBadgesBadgeClass = {
    type: string; // BadgeClass.
    id: string; // Unique identifier for this badgeclass (URL).
    issuer?: string; // Issuer for this badgeclass.
    name: string; // Name of the badgeclass.
    image: string; // URL to the image.
    description: string; // Description of the badge class.
    hostedUrl?: string; // Identifier of the open badge for this assertion.
    courseid?: number; // Course ID.
    coursefullname?: string; // Full name of the course.
    alignment?: { // Badge alignments.
        id?: number; // Alignment id.
        badgeid?: number; // Badge id.
        targetName?: string; // Target name.
        targetUrl?: string; // Target URL.
        targetDescription?: string; // Target description.
        targetFramework?: string; // Target framework.
        targetCode?: string; // Target code.
    }[];
    criteriaUrl?: string; // Criteria URL.
    criteriaNarrative?: string; // Criteria narrative.
};
