import React from "react";
import { useTranslation } from "next-i18next";
import { DownloadFileButton } from "./DownloadFileButton";

export const Share = () => {
  const { t } = useTranslation("form-builder");

  return (
    <>
      <p className="mb-6">{t("shareP1")}</p>
      <p className="mb-6">{t("shareP2")}</p>
      <br />

      <h2 className="text-[24px]">
        <span className="inline-block py-1.5 p-3 mr-3 bg-black-default text-white-default leading-none rounded-full">
          1
        </span>
        <span>{t("shareH2")}</span>
      </h2>
      <p className="mb-6">{t("shareP3")}</p>
      <h2 className="text-[24px]">
        <span className="inline-block py-1.5 p-3 mr-3 bg-black-default text-white-default leading-none rounded-full">
          2
        </span>
        <span>{t("shareH3")}</span>
      </h2>
      <p className="mb-6">{t("shareP4")}</p>

      <div className="mb-6">
        <DownloadFileButton />
      </div>
    </>
  );
};