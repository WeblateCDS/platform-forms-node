import React, { useCallback } from "react";
import { useTranslation } from "next-i18next";

import { ConfirmFormDeleteDialog } from "./shared";
import { clearTemplateStore } from "../store";
import { useDeleteForm } from "../hooks";
import { toast, ToastContainer } from "./shared/Toast";

export const ConfirmDelete = ({
  show,
  id,
  isPublished,
  handleClose,
  onDeleted,
}: {
  show: string | boolean | string[] | undefined;
  id: string;
  isPublished: boolean;
  handleClose: (arg: boolean) => void;
  onDeleted: (arg: string) => void;
}) => {
  const { t } = useTranslation("form-builder");
  const { handleDelete } = useDeleteForm();

  const handleConfirm = useCallback(async () => {
    const result = await handleDelete(id);
    if (result && "error" in result) {
      toast.error(t("formDeletedDialogMessageFailed"));
      return;
    }

    clearTemplateStore();
    onDeleted(id);
  }, [handleDelete, id, onDeleted, t]);

  return (
    <>
      {show && (
        <ConfirmFormDeleteDialog
          handleClose={() => handleClose(false)}
          handleConfirm={handleConfirm}
          isPublished={isPublished}
        />
      )}
      <div className="sticky top-0">
        <ToastContainer />
      </div>
    </>
  );
};