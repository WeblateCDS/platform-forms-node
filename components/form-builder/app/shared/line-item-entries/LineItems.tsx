import React from "react";
import { LineItem } from "./LineItem";

type LineItemsProps = {
  values: string[];
  errorEntriesList: string[];
  onRemove: (value: string) => void;
};

export const LineItems = ({ values = [], errorEntriesList = [], onRemove }: LineItemsProps) => {
  if (values.length <= 0) {
    return null;
  }

  return (
    <>
      {values.map((value) => (
        <LineItem
          value={value}
          key={value}
          onRemove={onRemove}
          isInvalid={errorEntriesList.find((valueError) => value === valueError) ? true : false}
        />
      ))}
    </>
  );
};
