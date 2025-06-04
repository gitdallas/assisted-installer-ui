import React, { MouseEvent } from 'react';
import {
  Button,
  ButtonVariant,
  FormGroup,
  Split,
  SplitItem,
  Tooltip,
  Dropdown,
  DropdownItem,
  MenuToggle,
} from '@patternfly/react-core';
import { useField } from 'formik';
import {
  CpuArchitecture,
  FeatureId,
  SupportedCpuArchitecture,
  architectureData,
  getFieldId,
} from '../../../../common';
import { ExternalPlaformIds, ExternalPlatformLabels, ExternalPlatformLinks } from './constants';
import { PlatformType, SupportLevel } from '@openshift-assisted/types/assisted-installer-service';
import {
  GetFeatureDisabledReason,
  GetFeatureSupportLevel,
  NewFeatureSupportLevelMap,
  useNewFeatureSupportLevel,
} from '../../../../common/components/newFeatureSupportLevels';
import NewFeatureSupportLevelBadge from '../../../../common/components/newFeatureSupportLevels/NewFeatureSupportLevelBadge';
import { useFeature } from '../../../hooks/use-feature';

const INPUT_NAME = 'platform';
const fieldId = getFieldId(INPUT_NAME, 'input');

type ExternalPlatformDropdownProps = {
  onChange: (selectedPlatform: PlatformType) => void;
  cpuArchitecture?: SupportedCpuArchitecture;
  featureSupportLevelData: NewFeatureSupportLevelMap | null;
  isSNO: boolean;
};

type ExternalPlatformInfo = {
  label: string;
  href?: string;
  disabledReason?: string;
  supportLevel?: SupportLevel;
};

const getDisabledReasonForExternalPlatform = (
  isSNO: boolean,
  getFeatureDisabledReason: GetFeatureDisabledReason,
  platform: PlatformType,
  featureSupportLevelData?: NewFeatureSupportLevelMap | null,
  cpuArchitecture?: SupportedCpuArchitecture,
): string | undefined => {
  if (isSNO && (platform === 'nutanix' || platform === 'vsphere')) {
    return `${ExternalPlatformLabels[platform]} integration is not supported for Single-Node OpenShift.`;
  } else if (
    isSNO &&
    (cpuArchitecture === CpuArchitecture.ppc64le || cpuArchitecture === CpuArchitecture.s390x)
  ) {
    return `Platform integration is not supported for Single-Node OpenShift with the selected CPU architecture.`;
  } else {
    return getFeatureDisabledReason(
      ExternalPlaformIds[platform] as FeatureId,
      featureSupportLevelData ?? undefined,
      cpuArchitecture,
    );
  }
};

const isAvailablePlatform = (platform: PlatformType, isDisconnected?: boolean) => {
  if (isDisconnected && platform === 'nutanix') {
    return false;
  }
  return platform !== undefined;
};

const getExternalPlatformTypes = (
  isSNO: boolean,
  getFeatureSupportLevel: GetFeatureSupportLevel,
  getFeatureDisabledReason: GetFeatureDisabledReason,
  featureSupportLevelData?: NewFeatureSupportLevelMap | null,
  cpuArchitecture?: SupportedCpuArchitecture,
  isDisconnected?: boolean,
): Partial<{ [key in PlatformType]: ExternalPlatformInfo }> => {
  const platforms = ['none', 'nutanix', 'external', 'vsphere'] as PlatformType[];

  const newPlatform = platforms
    .filter((platform) => isAvailablePlatform(platform, isDisconnected))
    .reduce(
      (a, platform) => ({
        ...a,
        [platform]: {
          label: ExternalPlatformLabels[platform],
          href: ExternalPlatformLinks[platform],
          disabledReason: getDisabledReasonForExternalPlatform(
            isSNO,
            getFeatureDisabledReason,
            platform,
            featureSupportLevelData ?? undefined,
            cpuArchitecture,
          ),
          supportLevel: getFeatureSupportLevel(
            ExternalPlaformIds[platform] as FeatureId,
            featureSupportLevelData ?? undefined,
          ),
        },
      }),
      {},
    );
  return newPlatform;
};

export const areAllExternalPlatformIntegrationDisabled = (
  externalPlatformTypes: Partial<{ [key in PlatformType]: ExternalPlatformInfo }>,
): boolean => {
  return Object.values(externalPlatformTypes)
    .filter((info) => info.label !== 'No platform integration')
    .every((info) => info.disabledReason !== undefined);
};

const getReasonForDropdownDisabled = (isSNO: boolean, labelCpuArch: string): string => {
  if (!isSNO) {
    return `Platform integration is not supported when ${labelCpuArch} is selected`;
  } else {
    return `Platform integration is not supported for SNO clusters`;
  }
};

export const ExternalPlatformDropdown = ({
  onChange,
  cpuArchitecture,
  featureSupportLevelData,
  isSNO,
}: ExternalPlatformDropdownProps) => {
  const [field, , { setValue }] = useField<string>(INPUT_NAME);
  const [isOpen, setOpen] = React.useState(false);
  const [externalPlatformTypes, setExternalPlatformTypes] = React.useState<
    Partial<{ [key in PlatformType]: ExternalPlatformInfo }>
  >({});
  const isSingleClusterFeatureEnabled = useFeature('ASSISTED_INSTALLER_SINGLE_CLUSTER_FEATURE');

  const tooltipDropdownDisabled = getReasonForDropdownDisabled(
    isSNO,
    cpuArchitecture ? architectureData[cpuArchitecture].label : '',
  );

  const { getFeatureSupportLevel, getFeatureDisabledReason } = useNewFeatureSupportLevel();

  React.useEffect(() => {
    const updatedExternalPlatformTypes = getExternalPlatformTypes(
      isSNO,
      getFeatureSupportLevel,
      getFeatureDisabledReason,
      featureSupportLevelData,
      cpuArchitecture,
      isSingleClusterFeatureEnabled,
    );
    setExternalPlatformTypes(updatedExternalPlatformTypes);
  }, [
    featureSupportLevelData,
    cpuArchitecture,
    isSNO,
    isSingleClusterFeatureEnabled,
    getFeatureSupportLevel,
    getFeatureDisabledReason,
  ]);

  const dropdownIsDisabled = React.useMemo(() => {
    return areAllExternalPlatformIntegrationDisabled(externalPlatformTypes);
  }, [externalPlatformTypes]);

  React.useEffect(() => {
    let isCurrentValueDisabled = false;

    if (field.value !== 'none') {
      isCurrentValueDisabled =
        externalPlatformTypes[field.value as PlatformType]?.disabledReason !== undefined;
    }
    if (dropdownIsDisabled || isCurrentValueDisabled) {
      setValue('none');
      onChange('none');
    }
  }, [dropdownIsDisabled, externalPlatformTypes, field.value, setValue, onChange]);

  const onSelect = (
    event: React.MouseEvent | React.KeyboardEvent | undefined,
    value: string | number | undefined,
  ) => {
    const selectedPlatform = (value || 'none') as PlatformType;
    setValue(selectedPlatform);
    setOpen(false);
    onChange(selectedPlatform);
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>, href: string): void => {
    event.stopPropagation();
    window.open(href, '_blank');
  };

  const enabledItems = Object.keys(externalPlatformTypes).map((platform) => {
    const { label, href, disabledReason, supportLevel } = externalPlatformTypes[
      platform as PlatformType
    ] as ExternalPlatformInfo;

    return (
      <DropdownItem key={platform} value={platform} isAriaDisabled={disabledReason !== undefined}>
        <Split>
          <SplitItem>
            <Tooltip hidden={!disabledReason} content={disabledReason} position="top">
              <div>
                {label}
                <span onClick={(event) => event.stopPropagation()}>
                  <NewFeatureSupportLevelBadge
                    featureId={ExternalPlaformIds[platform as PlatformType] as FeatureId}
                    supportLevel={supportLevel}
                  />
                </span>
              </div>
            </Tooltip>
          </SplitItem>
          {!!href && (
            <>
              <SplitItem isFilled />
              <SplitItem>
                <Button
                  variant={ButtonVariant.link}
                  isInline
                  style={{ float: 'right' }}
                  onClick={(event) => handleClick(event, href)}
                >
                  Learn more <i className="fas fa-external-link-alt" />
                </Button>
              </SplitItem>
            </>
          )}
        </Split>
      </DropdownItem>
    );
  });

  const toggle = React.useMemo(
    () => (toggleRef: React.RefObject<any>) =>
      (
        <MenuToggle
          onClick={() => setOpen(!isOpen)}
          isDisabled={dropdownIsDisabled}
          ref={toggleRef}
          className="pf-v5-u-w-100"
          isExpanded={isOpen}
        >
          {externalPlatformTypes[field.value as PlatformType]?.label || 'Select a platform'}
        </MenuToggle>
      ),
    [externalPlatformTypes, field.value, dropdownIsDisabled, isOpen],
  );

  return (
    <FormGroup
      id={`form-control__${fieldId}`}
      fieldId={fieldId}
      label={'Integrate with external partner platforms'}
    >
      <Tooltip
        content={tooltipDropdownDisabled}
        hidden={!dropdownIsDisabled}
        position="top"
        distance={7}
      >
        <Dropdown onSelect={onSelect} toggle={toggle} isOpen={isOpen} className="pf-v5-u-w-100">
          {enabledItems}
        </Dropdown>
      </Tooltip>
    </FormGroup>
  );
};
