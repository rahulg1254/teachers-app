import React from "react";
import { Text, Box, HStack, VStack } from "native-base";
import "./../../../assets/css/fullCalendar.css";

const renderEventContent = (eventInfo) => {
  let item = {
    ...eventInfo?.event?._def,
    ...eventInfo?.event?._def?.extendedProps,
    timeText: eventInfo?.timeText,
  };

  const inlineEllipsisStyle = {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  return (
    <Box p="4" {...inlineEllipsisStyle}>
      <VStack space={"8px"}>
        <HStack
          justifyContent={"space-between"}
          space="2"
          alignItems={"center"}
        >
          <Text
            fontSize="14px"
            fontWeight="600"
            {...inlineEllipsisStyle}
            {...{
              ...item._text,
              color: item._text?.color,
            }}
          >
            {item.title}
          </Text>
          <Text
            fontSize="14px"
            fontWeight="600"
            {...inlineEllipsisStyle}
            {...{
              ...item._text,
              color: item._text?.color,
            }}
          >
            {item.subTitle}
          </Text>
        </HStack>
        <Text
          fontSize="12px"
          fontWeight="500"
          {...inlineEllipsisStyle}
          {...{
            ...item._text,
            color: item._text?.color,
          }}
        >
          {item?.timeText}
        </Text>
      </VStack>
    </Box>
  );
};

export default renderEventContent;
