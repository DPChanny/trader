import { useState } from "preact/hooks";
import { useUsers } from "@/hooks/useUserApi";
import {
  usePresets,
  usePresetDetail,
  useCreatePreset,
} from "@/hooks/usePresetApi";
import { useAddPresetUser } from "@/hooks/usePresetUserApi";
import { useCreateAuction } from "@/hooks/useAuctionApi";
import { PresetList } from "./presetList";
import { TierPanel } from "./tierPanel";
import { PresetUserEditor } from "./presetUserEditor";
import { CreatePresetModal } from "./createPresetModal";
import { PrimaryButton } from "@/components/button";
import { UserGrid } from "@/components/userGrid";
import { Section } from "@/components/section";
import { Loading } from "@/components/loading";
import { Error } from "@/components/error";
import { Bar } from "@/components/bar";
import styles from "@/styles/pages/preset/presetPage.module.css";

interface PresetPageProps {
  onNavigateToAuction?: () => void;
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Section variant="primary" className="preset-list-container">
          <div className={styles.header}>
            <h2>프리셋 관리</h2>
            <PrimaryButton onClick={() => setIsCreating(true)}>
              추가
            </PrimaryButton>
          </div>
          <Bar variant="blue" />
          {presetsError && (
            <Error>프리셋 목록을 불러오는 데 실패했습니다.</Error>
          )}
          {!presetsError && (
            <PresetList
              presets={presets || []}
              selectedPresetId={selectedPresetId}
              onSelectPreset={handleSelectPreset}
              isLoading={presetsLoading}
            />
          )}
        </Section>

        <div className="preset-detail-section">
          {addPresetUser.isError && (
            <Error>유저를 프리셋에 추가하는 데 실패했습니다.</Error>
          )}
          {detailError && selectedPresetId && (
            <Error>선택한 프리셋의 상세 정보를 불러오는 데 실패했습니다.</Error>
          )}
          {usersError && selectedPresetId && (
            <Error>
              유저 목록을 불러오는 데 실패했습니다. 프리셋에 유저를 추가할 수
              없습니다.
            </Error>
          )}
          {selectedPresetId &&
          !detailLoading &&
          presetDetail &&
          !detailError &&
          !usersError ? (
            <>
              <div className="preset-header-row">
                <Section variant="secondary" className="preset-title-section">
                  <div className="preset-title-content">
                    <h2>{presetDetail.name}</h2>
                    <PrimaryButton onClick={handleStartAuction}>
                      경매 시작
                    </PrimaryButton>
                  </div>
                </Section>
                <Section variant="secondary" className="tier-panel-section">
                  <TierPanel
                    presetId={presetDetail.preset_id}
                    tiers={presetDetail.tiers || []}
                  />
                </Section>
              </div>

              <div className="preset-detail">
                <div className="grid-container">
                  <Section variant="secondary" className="grid-section">
                    <UserGrid
                      title={`프리셋 유저 목록 (${presetDetail.preset_users?.length || 0}명)`}
                      users={presetUserItems}
                      selectedUserId={selectedPresetUserId}
                      onUserClick={(id) =>
                        setSelectedPresetUserId(id as number)
                      }
                    />
                  </Section>
                  <Section variant="secondary" className="grid-section">
                    <UserGrid
                      title="유저 목록 (선택 시 추가)"
                      users={availableUsers}
                      onUserClick={(id) => handleAddUser(id as number)}
                    />
                  </Section>
                </div>

                {selectedPresetUser && (
                  <PresetUserEditor
                    presetUser={selectedPresetUser}
                    presetId={presetDetail.preset_id}
                    tiers={presetDetail.tiers || []}
                    leaders={presetDetail.leaders || []}
                    onClose={() => setSelectedPresetUserId(null)}
                  />
                )}
              </div>
            </>
          ) : selectedPresetId && detailLoading ? (
            <Loading />
          ) : (
            <div />
          )}
        </div>
      </div>

      <CreatePresetModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onSubmit={handleSubmit}
        presetName={newPresetName}
        onNameChange={setNewPresetName}
        error={createPreset.error}
      />
    </div>
  );
}
      riot_nickname: presetUser.user.riot_nickname,
      tier: tierName,
      positions,
      is_leader: isLeader,
    };
  });

  const selectedPresetUser =
    selectedPresetUserId && presetDetail
      ? presetDetail.preset_users.find(
          (pu: any) => pu.preset_user_id === selectedPresetUserId
        )
      : null;

  return (
    <div className="preset-page">
      <div className="preset-container">
        <Section variant="primary" className="preset-list-container">
          <div className="preset-page-header">
            <h2>프리셋 관리</h2>
            <PrimaryButton onClick={() => setIsCreating(true)}>
              추가
            </PrimaryButton>
          </div>
          <Bar variant="blue" />
          {presetsError && (
            <Error>프리셋 목록을 불러오는데 실패했습니다.</Error>
          )}
          {!presetsError && (
            <PresetList
              presets={presets || []}
              selectedPresetId={selectedPresetId}
              onSelectPreset={handleSelectPreset}
              isLoading={presetsLoading}
            />
          )}
        </Section>

        <div className="preset-detail-section">
          {addPresetUser.isError && (
            <Error>유저를 프리셋에 추가하는데 실패했습니다.</Error>
          )}
          {detailError && selectedPresetId && (
            <Error>선택한 프리셋의 상세 정보를 불러오는데 실패했습니다.</Error>
          )}
          {usersError && selectedPresetId && (
            <Error>
              유저 목록을 불러오는데 실패했습니다. 프리셋에 유저를 추가할 수
              없습니다.
            </Error>
          )}
          {selectedPresetId &&
          !detailLoading &&
          presetDetail &&
          !detailError &&
          !usersError ? (
            <>
              <div className="preset-header-row">
                <Section variant="secondary" className="preset-title-section">
                  <div className="preset-title-content">
                    <h2>{presetDetail.name}</h2>
                    <PrimaryButton onClick={handleStartAuction}>
                      경매 시작
                    </PrimaryButton>
                  </div>
                </Section>
                <Section variant="secondary" className="tier-panel-section">
                  <TierPanel
                    presetId={presetDetail.preset_id}
                    tiers={presetDetail.tiers || []}
                  />
                </Section>
              </div>

              <div className="preset-detail">
                <div className="grid-container">
                  <Section variant="secondary" className="grid-section">
                    <UserGrid
                      title={`프리셋 유저 목록 (${
                        presetDetail.preset_users?.length || 0
                      }명)`}
                      users={presetUserItems}
                      selectedUserId={selectedPresetUserId}
                      onUserClick={(id) =>
                        setSelectedPresetUserId(id as number)
                      }
                    />
                  </Section>
                  <Section variant="secondary" className="grid-section">
                    <UserGrid
                      title="유저 목록 (선택 시 추가)"
                      users={availableUsers}
                      onUserClick={(id) => handleAddUser(id as number)}
                    />
                  </Section>
                </div>

                {selectedPresetUser && (
                  <PresetUserEditor
                    presetUser={selectedPresetUser}
                    presetId={presetDetail.preset_id}
                    tiers={presetDetail.tiers || []}
                    leaders={presetDetail.leaders || []}
                    onClose={() => setSelectedPresetUserId(null)}
                  />
                )}
              </div>
            </>
          ) : selectedPresetId && detailLoading ? (
            <Loading />
          ) : (
            <div />
          )}
        </div>
      </div>

      <CreatePresetModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onSubmit={handleSubmit}
        presetName={newPresetName}
        onNameChange={setNewPresetName}
        error={createPreset.error}
      />
    </div>
  );
}
