import React from 'react';
import { EmptyState, EmptyStateBody, EmptyStateIcon, Title } from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/js/icons/exclamation-triangle-icon';
import { t_temp_dev_tbd as iconColor /* CODEMODS: you should update this color token, original v5 token was global_disabled_color_100 */ } from "@patternfly/react-tokens/dist/js/t_temp_dev_tbd";

const NoPermissionsError = () => (
  <EmptyState id="not-found">
    <EmptyStateBody>
      <EmptyStateIcon icon={ExclamationTriangleIcon} color={iconColor.value} />
      <Title headingLevel="h2">Access permissions needed</Title>
      <EmptyStateBody>
        To create a cluster using the Assisted Installer, ask your organization administrator to
        adjust your permissions.
      </EmptyStateBody>
    </EmptyStateBody>
  </EmptyState>
);

export default NoPermissionsError;
