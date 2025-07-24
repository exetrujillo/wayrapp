import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { exerciseSchema, ExerciseFormData } from "../../utils/validation";
import { EXERCISE_TYPES } from "../../utils/constants";
import { exerciseService } from "../../services/exerciseService";
import { CreateExerciseRequest } from "../../utils/types";
import { Button } from "../ui/Button";
import { Feedback } from "../ui/Feedback";
import { Card } from "../ui/Card";

interface ExerciseFormProps {
  onSuccess?: (exercise: any) => void;
  onCancel?: () => void;
}

export const ExerciseForm: React.FC<ExerciseFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const {
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      exerciseType: "translation",
      data: {},
    },
  });

  // Watch the exercise type to render the appropriate form fields
  const exerciseType = watch("exerciseType");
  const exerciseData = watch("data") || ({} as Record<string, any>);

  // Handle JSON data input changes
  const handleDataChange = (field: string, value: any) => {
    const updatedData = { ...exerciseData } as Record<string, any>;

    // Handle nested fields with dot notation (e.g., "blanks.0.answer")
    if (field.includes(".")) {
      const parts = field.split(".");
      let current: any = updatedData;

      // Navigate to the nested object
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];

        // If it's an array index
        if (!isNaN(Number(part))) {
          const index = Number(part);
          // Ensure the array exists
          if (!Array.isArray(current)) {
            current = [];
          }
          // Ensure the array has enough elements
          while (current.length <= index) {
            current.push({});
          }
          current = current[index];
        } else {
          // Ensure the property exists
          if (part !== undefined && !current[part]) {
            current[part] = {};
          }
          if (part !== undefined) {
            current = current[part];
          }
        }
      }

      // Set the value at the final level
      const lastPart = parts[parts.length - 1];
      if (lastPart !== undefined) {
        current[lastPart] = value;
      }
    } else {
      updatedData[field] = value;
    }

    setValue("data", updatedData);
  };

  // Initialize default data structure when exercise type changes
  React.useEffect(() => {
    let defaultData = {};

    switch (exerciseType) {
      case "translation":
        defaultData = {
          source_text: "",
          target_text: "",
          hint: "",
        };
        break;
      case "fill-in-the-blank":
        defaultData = {
          text: "",
          blanks: [{ position: 0, answer: "", options: [] }],
        };
        break;
      case "vof":
        defaultData = {
          question: "",
          options: ["", "", "", ""],
          correct_option: 0,
          explanation: "",
        };
        break;
      case "pairs":
        defaultData = {
          pairs: [
            { left: "", right: "" },
            { left: "", right: "" },
          ],
        };
        break;
      case "informative":
        defaultData = {
          content: "",
          title: "",
        };
        break;
      case "ordering":
        defaultData = {
          items: ["", ""],
          correct_order: [0, 1],
        };
        break;
    }

    setValue("data", defaultData);
  }, [exerciseType, setValue]);

  const onSubmit = async (data: ExerciseFormData) => {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      // Convert form data to API request format
      const requestData: CreateExerciseRequest = {
        exerciseType: data.exerciseType,
        data: data.data,
      };

      const response = await exerciseService.createExercise(requestData);
      setFeedback({
        type: "success",
        message: t(
          "creator.forms.exercise.successMessage",
          "Exercise created successfully!"
        ),
      });
      reset();
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error: any) {
      setFeedback({
        type: "error",
        message:
          error.message || t("common.messages.error", "An error occurred"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    if (onCancel) {
      onCancel();
    }
  };

  // Render form fields based on exercise type
  const renderExerciseFields = () => {
    switch (exerciseType) {
      case "translation":
        return (
          <>
            <div className="mb-4">
              <label
                htmlFor="source_text"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                {t("creator.forms.exercise.sourceText", "Source Text")}
                <span className="text-error ml-1">*</span>
              </label>
              <textarea
                id="source_text"
                className="input w-full min-h-[80px]"
                value={(exerciseData["source_text"] as string) || ""}
                onChange={(e) =>
                  handleDataChange("source_text", e.target.value)
                }
                placeholder={t(
                  "creator.forms.exercise.sourceTextPlaceholder",
                  "Enter text in source language"
                )}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="target_text"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                {t(
                  "creator.forms.exercise.targetText",
                  "Target Text (Correct Answer)"
                )}
                <span className="text-error ml-1">*</span>
              </label>
              <textarea
                id="target_text"
                className="input w-full min-h-[80px]"
                value={(exerciseData["target_text"] as string) || ""}
                onChange={(e) =>
                  handleDataChange("target_text", e.target.value)
                }
                placeholder={t(
                  "creator.forms.exercise.targetTextPlaceholder",
                  "Enter expected translation"
                )}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="hint"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                {t("creator.forms.exercise.hint", "Hint (Optional)")}
              </label>
              <input
                type="text"
                id="hint"
                className="input w-full"
                value={(exerciseData["hint"] as string) || ""}
                onChange={(e) => handleDataChange("hint", e.target.value)}
                placeholder={t(
                  "creator.forms.exercise.hintPlaceholder",
                  "Enter optional hint for learners"
                )}
              />
            </div>
          </>
        );

      case "fill-in-the-blank":
        return (
          <>
            <div className="mb-4">
              <label
                htmlFor="text"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                {t("creator.forms.exercise.fillText", "Text with Blanks")}
                <span className="text-error ml-1">*</span>
              </label>
              <textarea
                id="text"
                className="input w-full min-h-[100px]"
                value={(exerciseData["text"] as string) || ""}
                onChange={(e) => handleDataChange("text", e.target.value)}
                placeholder={t(
                  "creator.forms.exercise.fillTextPlaceholder",
                  "Enter text with ___ for blanks"
                )}
              />
              <p className="mt-1 text-xs text-neutral-500">
                {t(
                  "creator.forms.exercise.fillTextHelp",
                  "Use ___ (three underscores) to indicate blanks in the text"
                )}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t("creator.forms.exercise.blanks", "Blanks")}
              </label>

              {Array.isArray(exerciseData["blanks"]) &&
                (exerciseData["blanks"] as any[]).map((blank: any, index) => (
                  <div
                    key={index}
                    className="mb-4 p-4 border border-neutral-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">
                        {t("creator.forms.exercise.blank", "Blank")} #
                        {index + 1}
                      </h4>
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const updatedBlanks = [
                              ...((exerciseData["blanks"] as any[]) || []),
                            ];
                            updatedBlanks.splice(index, 1);
                            handleDataChange("blanks", updatedBlanks);
                          }}
                        >
                          {t("common.buttons.remove", "Remove")}
                        </Button>
                      )}
                    </div>

                    <div className="mb-2">
                      <label
                        htmlFor={`blank-${index}-answer`}
                        className="block text-sm font-medium text-neutral-700 mb-1"
                      >
                        {t("creator.forms.exercise.answer", "Correct Answer")}
                        <span className="text-error ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        id={`blank-${index}-answer`}
                        className="input w-full"
                        value={blank.answer || ""}
                        onChange={(e) => {
                          const updatedBlanks = [
                            ...((exerciseData["blanks"] as any[]) || []),
                          ];
                          updatedBlanks[index] = {
                            ...blank,
                            answer: e.target.value,
                          };
                          handleDataChange("blanks", updatedBlanks);
                        }}
                        placeholder={t(
                          "creator.forms.exercise.answerPlaceholder",
                          "Enter correct answer"
                        )}
                      />
                    </div>

                    <div className="mb-2">
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        {t(
                          "creator.forms.exercise.options",
                          "Options (Optional)"
                        )}
                      </label>
                      <div className="space-y-2">
                        {Array.isArray(blank.options)
                          ? blank.options.map(
                              (option: any, optIndex: number) => (
                                <div
                                  key={optIndex}
                                  className="flex items-center space-x-2"
                                >
                                  <input
                                    type="text"
                                    className="input flex-1"
                                    value={option || ""}
                                    onChange={(e) => {
                                      const updatedBlanks = [
                                        ...((exerciseData["blanks"] as any[]) ||
                                          []),
                                      ];
                                      const updatedOptions = [
                                        ...(blank.options || []),
                                      ];
                                      updatedOptions[optIndex] = e.target.value;
                                      updatedBlanks[index] = {
                                        ...blank,
                                        options: updatedOptions,
                                      };
                                      handleDataChange("blanks", updatedBlanks);
                                    }}
                                    placeholder={t(
                                      "creator.forms.exercise.optionPlaceholder",
                                      "Enter option"
                                    )}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      const updatedBlanks = [
                                        ...((exerciseData["blanks"] as any[]) ||
                                          []),
                                      ];
                                      const updatedOptions = [
                                        ...(blank.options || []),
                                      ];
                                      updatedOptions.splice(optIndex, 1);
                                      updatedBlanks[index] = {
                                        ...blank,
                                        options: updatedOptions,
                                      };
                                      handleDataChange("blanks", updatedBlanks);
                                    }}
                                  >
                                    {t("common.buttons.remove", "Remove")}
                                  </Button>
                                </div>
                              )
                            )
                          : null}

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const updatedBlanks = [
                              ...((exerciseData["blanks"] as any[]) || []),
                            ];
                            const updatedOptions = [
                              ...(blank.options || []),
                              "",
                            ];
                            updatedBlanks[index] = {
                              ...blank,
                              options: updatedOptions,
                            };
                            handleDataChange("blanks", updatedBlanks);
                          }}
                        >
                          {t("creator.forms.exercise.addOption", "Add Option")}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const updatedBlanks = [
                    ...((exerciseData["blanks"] as any[]) || []),
                    {
                      position: (exerciseData["blanks"] as any[])?.length || 0,
                      answer: "",
                      options: [],
                    },
                  ];
                  handleDataChange("blanks", updatedBlanks);
                }}
              >
                {t("creator.forms.exercise.addBlank", "Add Blank")}
              </Button>
            </div>
          </>
        );

      case "vof":
        return (
          <>
            <div className="mb-4">
              <label
                htmlFor="question"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                {t("creator.forms.exercise.question", "Question")}
                <span className="text-error ml-1">*</span>
              </label>
              <textarea
                id="question"
                className="input w-full min-h-[80px]"
                value={(exerciseData["question"] as string) || ""}
                onChange={(e) => handleDataChange("question", e.target.value)}
                placeholder={t(
                  "creator.forms.exercise.questionPlaceholder",
                  "Enter the question"
                )}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t("creator.forms.exercise.options", "Options")}
                <span className="text-error ml-1">*</span>
              </label>

              {Array.isArray(exerciseData["options"]) &&
                (exerciseData["options"] as any[]).map((option, index) => (
                  <div key={index} className="mb-2 flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`option-${index}`}
                      name="correct_option"
                      checked={
                        (exerciseData["correct_option"] as number) === index
                      }
                      onChange={() => handleDataChange("correct_option", index)}
                      className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-300"
                    />
                    <input
                      type="text"
                      className="input flex-1"
                      value={option || ""}
                      onChange={(e) => {
                        const updatedOptions = [
                          ...(exerciseData["options"] as any[]),
                        ];
                        updatedOptions[index] = e.target.value;
                        handleDataChange("options", updatedOptions);
                      }}
                      placeholder={t(
                        "creator.forms.exercise.optionPlaceholder",
                        `Option ${index + 1}`
                      )}
                    />
                    {(exerciseData["options"] as any[]).length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const updatedOptions = [
                            ...(exerciseData["options"] as any[]),
                          ];
                          updatedOptions.splice(index, 1);
                          handleDataChange("options", updatedOptions);

                          // Update correct_option if needed
                          if (
                            (exerciseData["correct_option"] as number) === index
                          ) {
                            handleDataChange("correct_option", 0);
                          } else if (
                            (exerciseData["correct_option"] as number) > index
                          ) {
                            handleDataChange(
                              "correct_option",
                              (exerciseData["correct_option"] as number) - 1
                            );
                          }
                        }}
                      >
                        {t("common.buttons.remove", "Remove")}
                      </Button>
                    )}
                  </div>
                ))}

              <Button
                type="button"
                variant="outline"
                className="mt-2"
                onClick={() => {
                  const updatedOptions = [
                    ...((exerciseData["options"] as any[]) || []),
                    "",
                  ];
                  handleDataChange("options", updatedOptions);
                }}
              >
                {t("creator.forms.exercise.addOption", "Add Option")}
              </Button>
            </div>

            <div className="mb-4">
              <label
                htmlFor="explanation"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                {t(
                  "creator.forms.exercise.explanation",
                  "Explanation (Optional)"
                )}
              </label>
              <textarea
                id="explanation"
                className="input w-full min-h-[80px]"
                value={(exerciseData["explanation"] as string) || ""}
                onChange={(e) =>
                  handleDataChange("explanation", e.target.value)
                }
                placeholder={t(
                  "creator.forms.exercise.explanationPlaceholder",
                  "Explain why the correct answer is right"
                )}
              />
            </div>
          </>
        );

      case "pairs":
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t("creator.forms.exercise.matchingPairs", "Matching Pairs")}
                <span className="text-error ml-1">*</span>
              </label>

              {Array.isArray(exerciseData["pairs"]) &&
                (exerciseData["pairs"] as any[]).map((pair, index) => (
                  <div
                    key={index}
                    className="mb-2 p-3 border border-neutral-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">
                        {t("creator.forms.exercise.pair", "Pair")} #{index + 1}
                      </h4>
                      {(exerciseData["pairs"] as any[]).length > 2 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const updatedPairs = [
                              ...(exerciseData["pairs"] as any[]),
                            ];
                            updatedPairs.splice(index, 1);
                            handleDataChange("pairs", updatedPairs);
                          }}
                        >
                          {t("common.buttons.remove", "Remove")}
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label
                          htmlFor={`pair-${index}-left`}
                          className="block text-sm font-medium text-neutral-700 mb-1"
                        >
                          {t("creator.forms.exercise.leftItem", "Left Item")}
                        </label>
                        <input
                          type="text"
                          id={`pair-${index}-left`}
                          className="input w-full"
                          value={pair.left || ""}
                          onChange={(e) => {
                            const updatedPairs = [
                              ...(exerciseData["pairs"] as any[]),
                            ];
                            updatedPairs[index] = {
                              ...pair,
                              left: e.target.value,
                            };
                            handleDataChange("pairs", updatedPairs);
                          }}
                          placeholder={t(
                            "creator.forms.exercise.leftItemPlaceholder",
                            "Left item"
                          )}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`pair-${index}-right`}
                          className="block text-sm font-medium text-neutral-700 mb-1"
                        >
                          {t("creator.forms.exercise.rightItem", "Right Item")}
                        </label>
                        <input
                          type="text"
                          id={`pair-${index}-right`}
                          className="input w-full"
                          value={pair.right || ""}
                          onChange={(e) => {
                            const updatedPairs = [
                              ...(exerciseData["pairs"] as any[]),
                            ];
                            updatedPairs[index] = {
                              ...pair,
                              right: e.target.value,
                            };
                            handleDataChange("pairs", updatedPairs);
                          }}
                          placeholder={t(
                            "creator.forms.exercise.rightItemPlaceholder",
                            "Right item"
                          )}
                        />
                      </div>
                    </div>
                  </div>
                ))}

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const updatedPairs = [
                    ...((exerciseData["pairs"] as any[]) || []),
                    { left: "", right: "" },
                  ];
                  handleDataChange("pairs", updatedPairs);
                }}
              >
                {t("creator.forms.exercise.addPair", "Add Pair")}
              </Button>
            </div>
          </>
        );

      case "informative":
        return (
          <>
            <div className="mb-4">
              <label
                htmlFor="audio_url"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                {t("creator.forms.exercise.audioUrl", "Audio URL")}
                <span className="text-error ml-1">*</span>
              </label>
              <input
                type="text"
                id="audio_url"
                className="input w-full"
                value={(exerciseData["audio_url"] as string) || ""}
                onChange={(e) => handleDataChange("audio_url", e.target.value)}
                placeholder={t(
                  "creator.forms.exercise.audioUrlPlaceholder",
                  "Enter URL to audio file"
                )}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="transcript"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                {t("creator.forms.exercise.transcript", "Transcript")}
                <span className="text-error ml-1">*</span>
              </label>
              <textarea
                id="transcript"
                className="input w-full min-h-[100px]"
                value={(exerciseData["transcript"] as string) || ""}
                onChange={(e) => handleDataChange("transcript", e.target.value)}
                placeholder={t(
                  "creator.forms.exercise.transcriptPlaceholder",
                  "Enter transcript of the audio"
                )}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="question"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                {t("creator.forms.exercise.question", "Question (Optional)")}
              </label>
              <input
                type="text"
                id="question"
                className="input w-full"
                value={(exerciseData["question"] as string) || ""}
                onChange={(e) => handleDataChange("question", e.target.value)}
                placeholder={t(
                  "creator.forms.exercise.questionPlaceholder",
                  "Enter question about the audio"
                )}
              />
            </div>
          </>
        );

      case "ordering":
        return (
          <>
            <div className="mb-4">
              <label
                htmlFor="prompt"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                {t("creator.forms.exercise.prompt", "Speaking Prompt")}
                <span className="text-error ml-1">*</span>
              </label>
              <textarea
                id="prompt"
                className="input w-full min-h-[80px]"
                value={(exerciseData["prompt"] as string) || ""}
                onChange={(e) => handleDataChange("prompt", e.target.value)}
                placeholder={t(
                  "creator.forms.exercise.promptPlaceholder",
                  "Enter speaking prompt"
                )}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="sample_answer"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                {t("creator.forms.exercise.sampleAnswer", "Sample Answer")}
                <span className="text-error ml-1">*</span>
              </label>
              <textarea
                id="sample_answer"
                className="input w-full min-h-[80px]"
                value={(exerciseData["sample_answer"] as string) || ""}
                onChange={(e) =>
                  handleDataChange("sample_answer", e.target.value)
                }
                placeholder={t(
                  "creator.forms.exercise.sampleAnswerPlaceholder",
                  "Enter a sample correct response"
                )}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="pronunciation_guide"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                {t(
                  "creator.forms.exercise.pronunciationGuide",
                  "Pronunciation Guide (Optional)"
                )}
              </label>
              <textarea
                id="pronunciation_guide"
                className="input w-full min-h-[80px]"
                value={(exerciseData["pronunciation_guide"] as string) || ""}
                onChange={(e) =>
                  handleDataChange("pronunciation_guide", e.target.value)
                }
                placeholder={t(
                  "creator.forms.exercise.pronunciationGuidePlaceholder",
                  "Enter pronunciation tips"
                )}
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  // Render exercise preview
  const renderExercisePreview = () => {
    if (!showPreview) return null;

    return (
      <div className="mt-6 border-t pt-4">
        <h3 className="text-lg font-semibold mb-3">
          {t("creator.forms.exercise.preview", "Exercise Preview")}
        </h3>

        <Card className="p-4">
          {exerciseType === "translation" && (
            <div>
              <h4 className="font-medium mb-2">
                {t(
                  "creator.forms.exercise.translationExercise",
                  "Translation Exercise"
                )}
              </h4>
              <p className="mb-3">
                {(exerciseData["source_text"] as string) ||
                  t(
                    "creator.forms.exercise.noSourceText",
                    "No source text provided"
                  )}
              </p>

              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">
                  {t(
                    "creator.forms.exercise.yourTranslation",
                    "Your Translation:"
                  )}
                </label>
                <textarea
                  className="input w-full"
                  disabled
                  placeholder={t(
                    "creator.forms.exercise.enterTranslation",
                    "Enter your translation here"
                  )}
                />
              </div>

              {(exerciseData["hint"] as string) && (
                <div className="text-sm text-neutral-600 italic">
                  <strong>{t("creator.forms.exercise.hint", "Hint:")}</strong>{" "}
                  {exerciseData["hint"] as string}
                </div>
              )}
            </div>
          )}

          {exerciseType === "fill-in-the-blank" && (
            <div>
              <h4 className="font-medium mb-2">
                {t(
                  "creator.forms.exercise.fillBlankExercise",
                  "Fill in the Blank Exercise"
                )}
              </h4>

              {exerciseData["text"] ? (
                <p className="mb-3">
                  {(exerciseData["text"] as string)
                    .split("___")
                    .map((part, i, arr) => (
                      <React.Fragment key={i}>
                        {part}
                        {i < arr.length - 1 && (
                          <input
                            type="text"
                            className="border-b border-neutral-400 w-20 mx-1 px-1 text-center"
                            disabled
                          />
                        )}
                      </React.Fragment>
                    ))}
                </p>
              ) : (
                <p className="mb-3">
                  {t(
                    "creator.forms.exercise.noTextProvided",
                    "No text with blanks provided"
                  )}
                </p>
              )}

              {Array.isArray(exerciseData["blanks"]) &&
                exerciseData["blanks"].some(
                  (b) => Array.isArray(b.options) && b.options.length > 0
                ) && (
                  <div className="mt-3">
                    <p className="font-medium mb-2">
                      {t(
                        "creator.forms.exercise.availableOptions",
                        "Available options:"
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {exerciseData["blanks"].flatMap((blank, i) =>
                        Array.isArray(blank.options)
                          ? blank.options.map((opt: any, j: number) => (
                              <span
                                key={`${i}-${j}`}
                                className="px-2 py-1 bg-neutral-100 rounded-md text-sm"
                              >
                                {opt ||
                                  `(${t(
                                    "creator.forms.exercise.emptyOption",
                                    "Empty option"
                                  )})`}
                              </span>
                            ))
                          : []
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}

          {exerciseType === "vof" && (
            <div>
              <h4 className="font-medium mb-2">
                {t(
                  "creator.forms.exercise.multipleChoiceExercise",
                  "Multiple Choice Exercise"
                )}
              </h4>

              <p className="mb-3">
                {(exerciseData["question"] as string) ||
                  t(
                    "creator.forms.exercise.noQuestionProvided",
                    "No question provided"
                  )}
              </p>

              {Array.isArray(exerciseData["options"]) && (
                <div className="space-y-2">
                  {(exerciseData["options"] as any[]).map((option, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="preview_option"
                        disabled
                        className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-300"
                      />
                      <span>
                        {option ||
                          `(${t(
                            "creator.forms.exercise.emptyOption",
                            "Empty option"
                          )})`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {(exerciseData["explanation"] as string) && (
                <div className="mt-3 p-2 bg-neutral-50 rounded border border-neutral-200">
                  <p className="text-sm">
                    <strong>
                      {t("creator.forms.exercise.explanation", "Explanation:")}
                    </strong>{" "}
                    {exerciseData["explanation"] as string}
                  </p>
                </div>
              )}
            </div>
          )}

          {exerciseType === "pairs" && (
            <div>
              <h4 className="font-medium mb-2">
                {t(
                  "creator.forms.exercise.matchingExercise",
                  "Matching Exercise"
                )}
              </h4>

              {Array.isArray(exerciseData["pairs"]) &&
              exerciseData["pairs"].length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">
                      {t("creator.forms.exercise.leftItems", "Left Items")}
                    </h5>
                    <ul className="space-y-2">
                      {(exerciseData["pairs"] as any[]).map((pair, i) => (
                        <li key={i} className="p-2 bg-neutral-100 rounded">
                          {pair.left ||
                            `(${t(
                              "creator.forms.exercise.emptyItem",
                              "Empty item"
                            )})`}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">
                      {t("creator.forms.exercise.rightItems", "Right Items")}
                    </h5>
                    <ul className="space-y-2">
                      {/* Shuffle the right items in preview */}
                      {[...(exerciseData["pairs"] as any[])]
                        .sort(() => Math.random() - 0.5)
                        .map((pair, i) => (
                          <li key={i} className="p-2 bg-neutral-100 rounded">
                            {pair.right ||
                              `(${t(
                                "creator.forms.exercise.emptyItem",
                                "Empty item"
                              )})`}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p>
                  {t(
                    "creator.forms.exercise.noPairsProvided",
                    "No matching pairs provided"
                  )}
                </p>
              )}
            </div>
          )}

          {exerciseType === "informative" && (
            <div>
              <h4 className="font-medium mb-2">
                {t(
                  "creator.forms.exercise.listeningExercise",
                  "Listening Exercise"
                )}
              </h4>

              <div className="mb-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-primary-500 text-white rounded-md flex items-center"
                  disabled
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t("creator.forms.exercise.playAudio", "Play Audio")}
                </button>
                <p className="text-sm text-neutral-500 mt-1">
                  {(exerciseData["audio_url"] as string) ||
                    t(
                      "creator.forms.exercise.noAudioUrl",
                      "No audio URL provided"
                    )}
                </p>
              </div>

              {(exerciseData["question"] as string) && (
                <div className="mb-3">
                  <p className="font-medium">
                    {exerciseData["question"] as string}
                  </p>
                </div>
              )}

              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">
                  {t("creator.forms.exercise.yourAnswer", "Your Answer:")}
                </label>
                <textarea
                  className="input w-full"
                  disabled
                  placeholder={t(
                    "creator.forms.exercise.enterAnswer",
                    "Enter your answer here"
                  )}
                />
              </div>

              <div className="mt-3 p-2 bg-neutral-50 rounded border border-neutral-200">
                <p className="text-sm">
                  <strong>
                    {t("creator.forms.exercise.transcript", "Transcript:")}
                  </strong>{" "}
                  {(exerciseData["transcript"] as string) ||
                    t(
                      "creator.forms.exercise.noTranscript",
                      "No transcript provided"
                    )}
                </p>
              </div>
            </div>
          )}

          {exerciseType === "ordering" && (
            <div>
              <h4 className="font-medium mb-2">
                {t(
                  "creator.forms.exercise.speakingExercise",
                  "Speaking Exercise"
                )}
              </h4>

              <div className="mb-4">
                <p className="font-medium">
                  {t("creator.forms.exercise.prompt", "Prompt:")}
                </p>
                <p>
                  {(exerciseData["prompt"] as string) ||
                    t(
                      "creator.forms.exercise.noPromptProvided",
                      "No prompt provided"
                    )}
                </p>
              </div>

              <div className="mb-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-primary-500 text-white rounded-md flex items-center"
                  disabled
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t("creator.forms.exercise.recordAnswer", "Record Answer")}
                </button>
              </div>

              {(exerciseData["pronunciation_guide"] as string) && (
                <div className="mt-3 p-2 bg-neutral-50 rounded border border-neutral-200">
                  <p className="text-sm">
                    <strong>
                      {t(
                        "creator.forms.exercise.pronunciationGuide",
                        "Pronunciation Guide:"
                      )}
                    </strong>{" "}
                    {exerciseData["pronunciation_guide"] as string}
                  </p>
                </div>
              )}

              <div className="mt-3 p-2 bg-neutral-50 rounded border border-neutral-200">
                <p className="text-sm">
                  <strong>
                    {t("creator.forms.exercise.sampleAnswer", "Sample Answer:")}
                  </strong>{" "}
                  {(exerciseData["sample_answer"] as string) ||
                    t(
                      "creator.forms.exercise.noSampleAnswer",
                      "No sample answer provided"
                    )}
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">
        {t("creator.forms.exercise.title", "Create Exercise")}
      </h2>

      {feedback && (
        <div className="mb-6">
          <Feedback
            type={feedback.type}
            message={feedback.message}
            onDismiss={() => setFeedback(null)}
          />
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Exercise Type */}
        <div className="mb-4">
          <label
            htmlFor="exerciseType"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            {t("creator.forms.exercise.type", "Exercise Type")}
            <span className="text-error ml-1">*</span>
          </label>
          <Controller
            name="exerciseType"
            control={control}
            render={({ field }: { field: any }) => (
              <div className="relative">
                <select
                  id="exerciseType"
                  className={`input w-full ${
                    errors.exerciseType
                      ? "border-error focus:border-error focus:ring-error"
                      : "border-neutral-300 focus:border-primary-500 focus:ring-primary-500"
                  }`}
                  {...field}
                >
                  {EXERCISE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.exerciseType && (
                  <p className="mt-1 text-sm text-error">
                    {errors.exerciseType.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>

        {/* Dynamic fields based on exercise type */}
        {renderExerciseFields()}

        {/* Preview toggle */}
        <div className="mt-6 mb-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview
              ? t("creator.forms.exercise.hidePreview", "Hide Preview")
              : t("creator.forms.exercise.showPreview", "Show Preview")}
          </Button>
        </div>

        {/* Exercise Preview */}
        {renderExercisePreview()}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={handleCancel}>
            {t("common.buttons.cancel", "Cancel")}
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {t("creator.forms.exercise.submit", "Create Exercise")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ExerciseForm;
