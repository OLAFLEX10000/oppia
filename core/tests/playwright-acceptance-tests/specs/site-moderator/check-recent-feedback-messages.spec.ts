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
 * @fileoverview SM.MP.02 Check recent feedback messages.
 */

import {test} from '@playwright/test';
import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';

test.describe.configure({mode: 'serial'});

test.describe('Site Moderator', function () {
  // Feedback submission is currently unavailable in the mobile viewport.
  test.skip(
    () => process.env.MOBILE === 'true',
    'Feedback submission is unavailable in the mobile viewport (#19443).'
  );

  let explorationIds: string[];
  let moderator: Awaited<ReturnType<typeof createModerator>>;

  async function createModerator(
    browser: Parameters<typeof UserFactory.createNewSuperAdmin>[0]
  ) {
    return UserFactory.createNewUser(
      'siteModerator',
      'site_moderator@example.com',
      browser,
      [testConstants.Roles.MODERATOR]
    );
  }

  test.beforeAll(async function ({browser}) {
    moderator = await createModerator(browser);
    const editor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com',
      browser
    );

    explorationIds = [];
    for (const [title, feedback] of [
      ['Feedback Exploration One', 'It was good'],
      ['Feedback Exploration Two', 'Needs some improvement'],
    ]) {
      const explorationId =
        await editor.createAndPublishAMinimalExplorationWithTitle(title);
      explorationIds.push(explorationId);
      await editor.playExplorationAsLoggedInUser(explorationId);
      await editor.openFeedbackPopup();
      await editor.writeAndSubmitFeedback(feedback);
    }
  });

  test('shows recent feedback and opens its exploration', async function () {
    await moderator.navigateToRecentFeedbackMessagesTab();
    await moderator.expectFeedbackMessagesForExplorations(
      explorationIds,
      'explorationEditor'
    );
    await moderator.openExplorationFeedback(explorationIds[0]);
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
