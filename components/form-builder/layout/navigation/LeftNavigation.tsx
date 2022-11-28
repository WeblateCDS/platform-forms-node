import React from "react";
import { useTranslation } from "next-i18next";
import { DesignIcon, PreviewIcon, ShareIcon, PublishIcon, SaveIcon } from "../../icons";
import { useSession } from "next-auth/react";
import { LeftNavLink } from "./LeftNavLink";

export const LeftNavigation = () => {
  const { t } = useTranslation("form-builder");
  const { status } = useSession();

  const iconClassname =
    "inline-block xl:block xl:mx-auto group-hover:fill-blue-hover group-focus:fill-white-default group-active:fill-white-default mr-2 -mt-1";

  return (
    <nav className="absolute xl:content-center" aria-label={t("navLabelFormBuilder")}>
      <LeftNavLink href="/form-builder/edit">
        <>
          <DesignIcon className={iconClassname} />
          {t("edit")}
        </>
      </LeftNavLink>

      <LeftNavLink href="/form-builder/preview">
        <>
          <PreviewIcon className={iconClassname} />
          {t("preview")}
        </>
      </LeftNavLink>

      <LeftNavLink href="/form-builder/share">
        <>
          <ShareIcon className={iconClassname} />
          {t("share")}
        </>
      </LeftNavLink>

      {status !== "authenticated" && (
        <LeftNavLink href="/form-builder/save">
          <>
            <SaveIcon className={iconClassname} />
            {t("save")}
          </>
        </LeftNavLink>
      )}

      <LeftNavLink href="/form-builder/publish">
        <>
          <PublishIcon className={iconClassname} />
          {t("publish")}
        </>
      </LeftNavLink>
    </nav>
  );
};