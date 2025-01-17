import React, { ReactElement } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "next-i18next";

import { useTemplateStore } from "../../../store/useTemplateStore";
import { Option } from "./Option";
import { Button } from "@components/globals";
import { FormElementWithIndex } from "../../../types";

const AddButton = ({ index, onClick }: { index: number; onClick: (index: number) => void }) => {
  const { t } = useTranslation("form-builder");
  return (
    <Button
      className="!m-0 !mt-4"
      theme="link"
      id={`add-option-${index}`}
      onClick={() => {
        onClick(index);
      }}
    >
      {t("addOption")}
    </Button>
  );
};

AddButton.propTypes = {
  index: PropTypes.number,
  onClick: PropTypes.func,
};

const AddOptions = ({ index }: { index: number }) => {
  const { addChoice, setFocusInput } = useTemplateStore((s) => ({
    addChoice: s.addChoice,
    setFocusInput: s.setFocusInput,
  }));

  return (
    <>
      <AddButton
        index={index}
        onClick={() => {
          setFocusInput(true);
          addChoice(index);
        }}
      />
    </>
  );
};

AddOptions.propTypes = {
  index: PropTypes.number,
};

type RenderIcon = (index: number) => ReactElement | string | undefined;

export const Options = ({
  item,
  renderIcon,
}: {
  item: FormElementWithIndex;
  renderIcon?: RenderIcon;
}) => {
  const { elements, translationLanguagePriority } = useTemplateStore((s) => ({
    elements: s.form.elements,
    translationLanguagePriority: s.translationLanguagePriority,
  }));

  const parentIndex = elements.findIndex((element) => element.id === item.id);
  const element = elements.find((element) => element.id === item.id);

  if (!element?.properties) {
    return null;
  }
  const { choices } = element.properties;

  if (!choices) {
    return <AddOptions index={parentIndex} />;
  }

  const options = choices.map((child, index) => {
    if (!child || !item) return null;

    const initialValue = element.properties.choices?.[index][translationLanguagePriority] ?? "";

    return (
      <Option
        renderIcon={renderIcon}
        parentIndex={parentIndex}
        key={`child-${item.id}-${index}`}
        id={item.id}
        index={index}
        initialValue={initialValue}
      />
    );
  });

  return (
    <div className="mt-5">
      {options}
      <AddOptions index={parentIndex} />
    </div>
  );
};

Options.propTypes = {
  item: PropTypes.object,
  renderIcon: PropTypes.func,
};
