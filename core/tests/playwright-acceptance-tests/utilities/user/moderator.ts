// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Moderator actions for Playwright acceptance tests.
 */

import {expect, Page} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';
import testConstants from '../common/test-constants';

const feedbackRows = '.e2e-test-feedback-messages-row';

export class Moderator extends BaseUser {
  async navigateToRecentFeedbackMessagesTab(): Promise<void> {
    await this.goto(testConstants.URLs.ModeratorPage);
    await this.clickOnElementWithSelector(
      '.e2e-test-feedback-messages-tab-link'
    );
    await expect(
      this.page.locator('.e2e-test-feedback-messages-header')
    ).toBeVisible();
  }

  async expectFeedbackMessagesForExplorations(
    explorationIds: string[],
    username: string
  ): Promise<void> {
    const rows = this.page.locator(feedbackRows);
    await expect(rows).toHaveCount(explorationIds.length);

    for (const explorationId of explorationIds) {
      const row = rows.filter({
        has: this.page.getByRole('link', {name: explorationId}),
      });
      await expect(row).toHaveCount(1);
      await expect(row.locator('td').nth(0)).not.toBeEmpty();
      await expect(row.locator('td').nth(2)).toHaveText(username);
    }

    const timestamps = await rows.locator('td:first-child').allTextContents();
    const dates = timestamps.map(timestamp => {
      const value = timestamp.trim();
      const time = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(value);
      if (time) {
        const hours =
          (Number(time[1]) % 12) + (time[3].toUpperCase() === 'PM' ? 12 : 0);
        const date = new Date();
        date.setHours(hours, Number(time[2]), 0, 0);
        return date.getTime();
      }
      const year = new Date().getFullYear();
      return Date.parse(
        /^[A-Za-z]{3} \d{1,2}$/.test(value) ? `${value}, ${year}` : value
      );
    });
    expect(dates.every(date => !Number.isNaN(date))).toBe(true);
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  }

  async openExplorationFeedback(explorationId: string): Promise<void> {
    await this.page
      .locator(feedbackRows)
      .getByRole('link', {
        name: explorationId,
      })
      .click();
    await expect(
      this.page.locator('.e2e-test-exploration-feedback-card')
    ).toBeVisible();
  }
}

export const ModeratorFactory = (page: Page): Moderator => new Moderator(page);
