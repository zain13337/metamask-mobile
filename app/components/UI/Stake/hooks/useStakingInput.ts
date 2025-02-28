import { BN } from 'ethereumjs-util';
import { useState, useMemo, useCallback } from 'react';
import {
  limitToMaximumDecimalPlaces,
  renderFiat,
} from '../../../../util/number';
import useStakingGasFee from './useStakingGasFee';
import useBalance from './useBalance';
import useInputHandler from './useInputHandler';
import useVaultApyAverages from './useVaultApyAverages';
import {
  CommonPercentageInputUnits,
  formatPercent,
  PercentageOutputFormat,
} from '../utils/value';
import BigNumber from 'bignumber.js';

const useStakingInputHandlers = () => {
  const [estimatedAnnualRewards, setEstimatedAnnualRewards] = useState('-');
  const { balanceWei: balance, balanceETH, balanceFiatNumber } = useBalance();

  const {
    isEth,
    currencyToggleValue,
    isNonZeroAmount,
    handleKeypadChange,
    handleCurrencySwitch,
    percentageOptions,
    handleQuickAmountPress,
    currentCurrency,
    handleEthInput,
    handleFiatInput,
    conversionRate,
    amountEth,
    amountWei,
    fiatAmount,
    handleMaxInput,
  } = useInputHandler({ balance });

  const { estimatedGasFeeWei, isLoadingStakingGasFee, isStakingGasFeeError } =
    useStakingGasFee(balance.toString());

  const maxStakeableAmountWei = useMemo(
    () =>
      !isStakingGasFeeError && balance.gt(estimatedGasFeeWei)
        ? balance.sub(estimatedGasFeeWei)
        : new BN(0),

    [balance, estimatedGasFeeWei, isStakingGasFeeError],
  );

  const isOverMaximum = useMemo(() => {
    const additionalFundsRequired = amountWei.sub(maxStakeableAmountWei);
    return isNonZeroAmount && additionalFundsRequired.gt(new BN(0));
  }, [amountWei, isNonZeroAmount, maxStakeableAmountWei]);

  const { vaultApyAverages, isLoadingVaultApyAverages } = useVaultApyAverages();

  // e.g. 2.8%
  const annualRewardRate = formatPercent(vaultApyAverages.oneWeek, {
    inputFormat: CommonPercentageInputUnits.PERCENTAGE,
    outputFormat: PercentageOutputFormat.PERCENT_SIGN,
    fixed: 1,
  });

  // e.g. 0.02841806
  const annualRewardRateDecimal = new BigNumber(vaultApyAverages.oneWeek)
    .dividedBy(100)
    .toNumber();

  const handleMax = useCallback(async () => {
    if (!balance) return;
    handleMaxInput(maxStakeableAmountWei);
  }, [balance, handleMaxInput, maxStakeableAmountWei]);

  const annualRewardsETH = useMemo(
    () =>
      `${limitToMaximumDecimalPlaces(
        parseFloat(amountEth) * annualRewardRateDecimal,
        5,
      )} ETH`,
    [amountEth, annualRewardRateDecimal],
  );

  const annualRewardsFiat = useMemo(
    () =>
      renderFiat(
        parseFloat(fiatAmount) * annualRewardRateDecimal,
        currentCurrency,
        2,
      ),
    [fiatAmount, annualRewardRateDecimal, currentCurrency],
  );

  const calculateEstimatedAnnualRewards = useCallback(() => {
    if (isNonZeroAmount) {
      if (isEth) {
        setEstimatedAnnualRewards(annualRewardsETH);
      } else {
        setEstimatedAnnualRewards(annualRewardsFiat);
      }
    } else {
      setEstimatedAnnualRewards(annualRewardRate);
    }
  }, [
    isNonZeroAmount,
    isEth,
    annualRewardsETH,
    annualRewardsFiat,
    annualRewardRate,
  ]);

  const balanceValue = isEth
    ? `${balanceETH} ETH`
    : `${balanceFiatNumber?.toString()} ${currentCurrency.toUpperCase()}`;

  const getDepositTxGasPercentage = useCallback(
    () => estimatedGasFeeWei.mul(new BN(100)).div(amountWei).toString(),
    [amountWei, estimatedGasFeeWei],
  );

  // Gas fee make up 30% or more of the deposit amount.
  const isHighGasCostImpact = useCallback(
    () => new BN(getDepositTxGasPercentage()).gt(new BN(30)),
    [getDepositTxGasPercentage],
  );

  return {
    amountEth,
    amountWei,
    fiatAmount,
    isEth,
    currencyToggleValue,
    isNonZeroAmount,
    isOverMaximum,
    handleEthInput,
    handleFiatInput,
    handleKeypadChange,
    handleCurrencySwitch,
    percentageOptions,
    handleQuickAmountPress,
    currentCurrency,
    conversionRate,
    estimatedAnnualRewards,
    calculateEstimatedAnnualRewards,
    annualRewardsETH,
    annualRewardsFiat,
    annualRewardRate,
    isLoadingVaultApyAverages,
    handleMax,
    isLoadingStakingGasFee,
    balanceValue,
    getDepositTxGasPercentage,
    isHighGasCostImpact,
    estimatedGasFeeWei,
  };
};

export default useStakingInputHandlers;
