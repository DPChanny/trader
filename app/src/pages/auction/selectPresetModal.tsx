import { Modal } from "@/components/modal";
import { Loading } from "@/components/loading";
import { Error } from "@/components/error";
import styles from "@/styles/pages/preset/presetList.module.css";

interface SelectPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (presetId: number) => void;
  presets: any[];
  isLoading: boolean;
  error?: any;
}

export function SelectPresetModal({
  isOpen,
  onClose,
  onSelectPreset,
  presets,
  isLoading,
  error,
}: SelectPresetModalProps) {
  const handlePresetClick = (presetId: number) => {
    onSelectPreset(presetId);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="프리셋 선택">
      <div className={styles.section}>
        {error && <Error>프리셋 목록을 불러오는데 실패했습니다.</Error>}
        {isLoading ? (
          <Loading />
        ) : (
          <div className={styles.list}>
            {presets?.map((preset) => (
              <div
                key={preset.preset_id}
                className={styles.item}
                onClick={() => handlePresetClick(preset.preset_id)}
              >
                <div className={styles.itemContent}>
                  <div className={styles.itemInfo}>
                    <span className="font-semibold text-white">
                      {preset.name}
                    </span>
                    <div className={styles.itemDetails}>
                      <span className="text-xs text-gray-400">
                        포인트: {preset.points}
                      </span>
                      <span className="text-xs text-gray-400">
                        타이머: {preset.time}초
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
