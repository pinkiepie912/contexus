import React, { useState } from "react";
import { Send, Copy, Check, AlertTriangle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { useBuilderStore } from "~/stores/builderStore";

interface ActionButtonsProps {
  onInject: (prompt: string) => void;
  onCopy: (prompt: string) => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onInject,
  onCopy,
}) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [injectSuccess, setInjectSuccess] = useState(false);
  const { elements, selectedTemplate, buildPreview } = useBuilderStore();

  const handleCopyClick = async () => {
    const prompt = buildPreview();
    try {
      await navigator.clipboard.writeText(prompt);
      onCopy(prompt);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = prompt;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        onCopy(prompt);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (fallbackError) {
        console.error("Fallback copy failed:", fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleInjectClick = () => {
    const prompt = buildPreview();
    onInject(prompt);
    setInjectSuccess(true);
    setTimeout(() => setInjectSuccess(false), 2000);
  };

  // Validation logic
  const isEmpty = elements.length === 0;
  const hasTemplate = selectedTemplate !== null;
  const requiredSlots = selectedTemplate?.requiredSlots || [];
  const hasRequiredSlots = requiredSlots.some(slot => slot.required);

  // Check if all required slots are filled
  const templateElement = hasTemplate
    ? elements.find(el => el.element.id === selectedTemplate.id)
    : null;

  const unfilledRequiredSlots = hasTemplate && hasRequiredSlots
    ? requiredSlots.filter(slot =>
        slot.required && !templateElement?.slotAssignments?.[slot.id]
      )
    : [];

  const hasUnfilledRequiredSlots = unfilledRequiredSlots.length > 0;
  const isDisabled = isEmpty;

  // Preview the built prompt
  const prompt = buildPreview();
  const promptPreview = prompt.length > 200 ? prompt.slice(0, 200) + "..." : prompt;

  return (
    <div className="space-y-4">
      {/* Validation Status */}
      {!isEmpty && (
        <Card className={`${
          hasUnfilledRequiredSlots
            ? "border-yellow-200 bg-yellow-50/50"
            : "border-green-200 bg-green-50/50"
        }`}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm">
              {hasUnfilledRequiredSlots ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-yellow-800">
                    {unfilledRequiredSlots.length}개의 필수 슬롯이 비어있습니다
                  </span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-green-800">
                    모든 요구사항이 충족되었습니다
                  </span>
                </>
              )}
            </div>

            {hasUnfilledRequiredSlots && (
              <div className="mt-2 text-xs text-yellow-700">
                미완성 필수 슬롯: {unfilledRequiredSlots.map(slot => slot.name).join(", ")}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Prompt Preview */}
      {!isEmpty && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              프롬프트 미리보기
              <Badge variant="outline" className="text-xs">
                {prompt.length.toLocaleString()} 문자
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 rounded-lg p-3 max-h-32 overflow-y-auto">
              <pre className="text-sm font-mono whitespace-pre-wrap text-muted-foreground">
                {promptPreview}
              </pre>
              {prompt.length > 200 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  ...{(prompt.length - 200).toLocaleString()}자 더 있음
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Action Buttons */}
      <div className="grid grid-cols-1 gap-3">
        <Button
          onClick={handleInjectClick}
          disabled={isDisabled}
          className="w-full h-12 text-base"
          size="lg"
        >
          {injectSuccess ? (
            <>
              <Check className="h-5 w-5 mr-2" />
              적용됨!
            </>
          ) : (
            <>
              <Send className="h-5 w-5 mr-2" />
              ➡️ 입력창에 적용
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={handleCopyClick}
          disabled={isDisabled}
          className="w-full h-12 text-base"
          size="lg"
        >
          {copySuccess ? (
            <>
              <Check className="h-5 w-5 mr-2" />
              복사됨!
            </>
          ) : (
            <>
              <Copy className="h-5 w-5 mr-2" />
              📋 클립보드에 복사
            </>
          )}
        </Button>
      </div>

      {/* Statistics */}
      {!isEmpty && (
        <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/20 rounded-lg p-3">
          <div className="flex items-center gap-4">
            <span>엘리먼트: {elements.length}개</span>
            {hasTemplate && (
              <span>
                슬롯: {requiredSlots.length}개
                ({requiredSlots.filter(slot => slot.required).length} 필수)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasTemplate && (
              <Badge variant="outline" className="text-xs">
                템플릿
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              {prompt.split(/\s+/).length} 단어
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
};