import React, { useEffect, useState } from "react";
import { FormikProps, withFormik } from "formik";
import { getFormInitialValues } from "@lib/formBuilder";
import { getErrorList, setFocusOnErrorMessage, validateOnSubmit } from "@lib/validation";
import { submitToAPI } from "@lib/helpers";
import { useExternalScript, useFlag, useFormTimer } from "@lib/hooks";
import { Alert, Button } from "@components/forms";
import { logMessage } from "@lib/logger";
import { useTranslation, TFunction } from "next-i18next";
import axios from "axios";
import Loader from "../../globals/Loader";
import classNames from "classnames";
import { Responses, PublicFormRecord } from "@lib/types";
import { NextRouter } from "next/router";
import Markdown from "markdown-to-jsx";
import styled from "styled-components";
import { BackArrowIcon } from "../icons";
import useTemplateStore from "../store/useTemplateStore";
import { LocalizedElementProperties } from "../types";

type InnerFormProps = FormProps & FormikProps<Responses>;

const Link = styled.div`
  text-decoration: underline;
  cursor: pointer;
  margin: 15px 0;

  & svg {
    display: inline-block;
  }
`;

const SubmitButtonLabel = styled.div`
  background-color: #cbc4f5;
  display: inline-block;
  padding: 2px 6px;
`;

/**
 * This is the "inner" form component that isn't connected to Formik and just renders a simple form
 * @param props
 */
const InnerForm: React.FC<InnerFormProps> = (props) => {
  const {
    children,
    handleSubmit,
    isSubmitting,
    formRecord: {
      formID,
      formConfig: { reCaptchaID, form },
    },
  }: InnerFormProps = props;
  const [canFocusOnError, setCanFocusOnError] = useState(false);
  const [lastSubmitCount, setLastSubmitCount] = useState(-1);

  const { t } = useTranslation();
  const { localizeField } = useTemplateStore();

  const errorList = props.errors ? getErrorList(props) : null;
  const errorId = "gc-form-errors";
  const serverErrorId = `${errorId}-server`;
  const formStatusError = props.status === "Error" ? t("server-error") : null;
  const formStatusSubmitted = props.status === "Submitted" ? true : false;
  const timerActive = useFlag("formTimer");
  const [formTimerState, { startTimer, checkTimer, disableTimer }] = useFormTimer();

  const isReCaptchaEnableOnSite = useFlag("reCaptcha");

  useExternalScript(
    `https://www.google.com/recaptcha/api.js?render=${reCaptchaID}`,
    isReCaptchaEnableOnSite
  );

  const [submitTooEarly, setSubmitTooEarly] = useState(false);

  const handleSubmitReCaptcha = (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    try {
      window.grecaptcha.ready(async () => {
        // get reCAPTCHA response
        const clientToken = await window.grecaptcha.execute(reCaptchaID, {
          action: "submit",
        });
        if (clientToken) {
          const scoreData = await sendClientTokenForVerification(clientToken);
          const { score, success } = scoreData.data;
          logMessage.info(`score : ${score}  status: ${success}`);
          // assuming you're not a Robot
          handleSubmit(evt);
        }
      });
    } catch (error) {
      logMessage.error(error as string);
    }
  };

  const sendClientTokenForVerification = (token: string) => {
    // call a backend API to verify reCAPTCHA response
    return axios({
      url: "/api/verify",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        userToken: token,
      },
      timeout: process.env.NODE_ENV === "production" ? 60000 : 0,
    });
  };

  //  If there are errors on the page, set focus the first error field
  useEffect(() => {
    if (formStatusError) {
      setFocusOnErrorMessage(props, serverErrorId);
    }

    if (!props.isValid && !canFocusOnError) {
      if (props.submitCount > lastSubmitCount) {
        setCanFocusOnError(true);
        setLastSubmitCount(props.submitCount);
      }
    } else if (!props.isValid) {
      setFocusOnErrorMessage(props, errorId);
      setCanFocusOnError(false);
    }
  }, [formStatusError, errorList, lastSubmitCount, canFocusOnError]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    // calculate initial delay for submit timer
    if (timerActive) {
      const secondsBaseDelay = 2;
      const secondsPerFormElement = 2;
      const numberOfRequiredElements = form.elements.filter(
        (element) => element.properties.validation?.required === true
      ).length;

      const submitDelaySeconds =
        secondsBaseDelay + numberOfRequiredElements * secondsPerFormElement;
      startTimer(submitDelaySeconds);
      // Initiate a callback to ensure that state of submit button is correctly displayed
      timeoutId = setTimeout(() => {
        checkTimer();
      }, submitDelaySeconds * 1000);
    } else {
      disableTimer();
    }

    return () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [timerActive]);

  return !props.isPreview &&
    (isSubmitting || (props.submitCount > 0 && props.isValid && !formStatusError)) ? (
    <Loader message={t("loading")} />
  ) : (
    <>
      {formStatusError && (
        <Alert type="error" heading={formStatusError} tabIndex={0} id={serverErrorId} />
      )}
      {errorList && (
        <Alert
          type="error"
          heading={t("input-validation.heading")}
          validation={true}
          id={errorId}
          tabIndex={0}
        >
          {errorList}
        </Alert>
      )}
      {formStatusSubmitted && props.isPreview && (
        <>
          <Link
            onClick={() => {
              props.setStatus("None");
            }}
          >
            <BackArrowIcon />
            Back to form preview
          </Link>
          <Markdown options={{ forceBlock: true }}>
            {form.endPage
              ? form.endPage[localizeField(LocalizedElementProperties.DESCRIPTION)]
              : ""}
          </Markdown>
        </>
      )}
      {/**
       * method attribute needs to stay here in case javascript does not load
       * otherwise GET request will be sent which will result in leaking all the user data
       * to the URL
       */}
      {!formStatusSubmitted && (
        <>
          <div className="gc-richText">
            <Markdown options={{ forceBlock: true }}>
              {form.introduction
                ? form.introduction[localizeField(LocalizedElementProperties.DESCRIPTION)]
                : ""}
            </Markdown>
          </div>
          <form
            id="form"
            data-testid="form"
            method="POST"
            onSubmit={(e) => {
              e.preventDefault();
              if (timerActive) {
                if (!formTimerState.canSubmit) {
                  window.dataLayer = window.dataLayer || [];
                  window.dataLayer.push({
                    event: "form_submission_spam_trigger",
                    formID: formID,
                    formTitle: form.titleEn,
                    submitTime: formTimerState.remainingTime,
                  });
                  setSubmitTooEarly(true);
                  // In case the useEffect timer failed check again
                  //formTimerDispatch({ type: "check" });
                  return;
                }
                // Only change state if submitTooEarly is already set to true
                submitTooEarly && setSubmitTooEarly(false);
              }

              if (isReCaptchaEnableOnSite) {
                handleSubmitReCaptcha(e);
              } else {
                handleSubmit(e);
              }
            }}
            noValidate
          >
            {children}
            <div
              className={classNames({
                "border-l-2": submitTooEarly,
                "border-red-default": submitTooEarly,
                "border-green-default": formTimerState.remainingTime === 0 && submitTooEarly,
                "pl-3": submitTooEarly,
              })}
            >
              {submitTooEarly &&
                (formTimerState.remainingTime > 0 ? (
                  <div role="alert">
                    <p className="gc-label text-red-default">
                      {t("spam-error.error-part-1")} {formTimerState.timerDelay}{" "}
                      {t("spam-error.error-part-2")}
                    </p>
                    <p className="gc-description">
                      {t("spam-error.prompt-part-1")} {formTimerState.remainingTime}{" "}
                      {t("spam-error.prompt-part-2")}
                    </p>
                  </div>
                ) : (
                  <div role="alert">
                    <p className="gc-label text-green-default">{t("spam-error.success-message")}</p>
                    <p className="gc-description">{t("spam-error.success-prompt")}</p>
                  </div>
                ))}
              <div className="gc-richText">
                <Markdown options={{ forceBlock: true }}>
                  {form.privacyPolicy
                    ? form.privacyPolicy[localizeField(LocalizedElementProperties.DESCRIPTION)]
                    : ""}
                </Markdown>
              </div>
              <div className="buttons">
                <Button type="submit">{t("submitButton")}</Button>
                {props.isPreview && (
                  <SubmitButtonLabel>
                    To preview your confirmation message, click submit
                  </SubmitButtonLabel>
                )}
              </div>
            </div>
          </form>
        </>
      )}
    </>
  );
};

interface FormProps {
  formRecord: PublicFormRecord;
  language: string;
  router: NextRouter;
  isReCaptchaEnableOnSite?: boolean;
  isPreview?: boolean;
  children?: (JSX.Element | undefined)[] | null;
  t: TFunction;
}

/**
 * This is the main Form component that wraps "InnerForm" withFormik hook, giving all of its components context
 * @param props
 */

export const Form = withFormik<FormProps, Responses>({
  validateOnChange: false,

  validateOnBlur: false,

  enableReinitialize: true, // needed when switching languages

  mapPropsToValues: (props) => getFormInitialValues(props.formRecord, props.language),

  validate: (values, props) => validateOnSubmit(values, props),

  handleSubmit: async (values, formikBag) => {
    if (formikBag.props.isPreview) {
      formikBag.setStatus("Submitted");
      return;
    }

    try {
      await submitToAPI(values, formikBag);
    } catch (err) {
      logMessage.error(err as Error);
    } finally {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "form_submission_trigger",
        formID: formikBag.props.formRecord.formID,
        formTitle: formikBag.props.formRecord.formConfig.form.titleEn,
      });

      formikBag.setSubmitting(false);
    }
  },
})(InnerForm);