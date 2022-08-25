
import { EuiIcon, EuiCode, EuiText, useEuiTheme } from '@elastic/eui'
import { appendIconComponentCache } from '@elastic/eui/es/components/icon/icon';
import { css } from '@emotion/react';

import { icon as arrowDown } from '@elastic/eui/es/components/icon/assets/arrow_down';
import { icon as arrowLeft } from '@elastic/eui/es/components/icon/assets/arrow_left';
import { icon as stopFilled } from '@elastic/eui/es/components/icon/assets/stop_filled';

appendIconComponentCache({
  arrowDown,
  arrowLeft,
  stopFilled
});

export const Test = () => {
  const { euiTheme } = useEuiTheme();

  return (
    <EuiText>
      <p>
        <EuiIcon
          type="stopFilled"
          size="xxl"
          css={{ color: euiTheme.colors.primary }}
        />{' '}
        This primary color will adjust based on the light or dark theme value
      </p>

      <EuiText
        css={css`
          background: ${euiTheme.colors.lightShade};
          padding: calc(${euiTheme.size.base} * 2);
        `}
      >
        The padding of this box is created using <EuiCode>calc()</EuiCode>{' '}
        because EUI&apos;s theme sizes are string pixel values that are
        calculated off the theme&apos;s <EuiCode>base</EuiCode>
      </EuiText>
    </EuiText>
  );
};