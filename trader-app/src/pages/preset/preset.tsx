import { useState } from "preact/hooks";
import { useUsers } from "../../hooks/useUserApi";
import {
  usePresets,
  usePresetDetail,
  useCreatePreset,
  useUpdatePreset,
  useDeletePreset,
  type PresetLeader,
} from "../../hooks/usePresetApi";
import {
  useAddPresetLeader,
  useRemovePresetLeader,
} from "../../hooks/usePresetLeaderApi";
import {
  useAddPresetUser,
  useUpdatePresetUser,
  useRemovePresetUser,
} from "../../hooks/usePresetUserApi";
import {
  useCreateTier,
  useUpdateTier,
  useDeleteTier,
} from "../../hooks/useTierApi";
import { useAddPosition, useDeletePosition } from "../../hooks/usePositionApi";
import { UserCard } from "../../components/userCard";
import "./preset.css";

export function Preset() {
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [editingPresetId, setEditingPresetId] = useState<number | null>(null);
  const [editingPresetName, setEditingPresetName] = useState("");

  const { data: presets, isLoading: presetsLoading } = usePresets();
  const { data: users } = useUsers();
  const { data: presetDetail, isLoading: detailLoading } =
    usePresetDetail(selectedPresetId);

  const createPreset = useCreatePreset();
  const updatePreset = useUpdatePreset();
  const deletePreset = useDeletePreset();

  const handleCreatePreset = async () => {
    if (!newPresetName.trim()) return;
    await createPreset.mutateAsync(newPresetName.trim());
    setNewPresetName("");
    setIsCreating(false);
  };

  const handleUpdatePreset = async (presetId: number) => {
    if (!editingPresetName.trim()) return;
    await updatePreset.mutateAsync({
      presetId,
      name: editingPresetName.trim(),
    });
    setEditingPresetId(null);
    setEditingPresetName("");
  };

  const handleDeletePreset = async (presetId: number) => {
    if (!confirm("이 프리셋을 삭제하시겠습니까?")) return;
    await deletePreset.mutateAsync(presetId);
    if (selectedPresetId === presetId) {
      setSelectedPresetId(null);
    }
  };

  return (
    <div className="preset-page">
      <div className="preset-container">
        <div className="preset-list-section">
          <div className="section-header">
            <h2>Presets</h2>
            <button className="btn-primary" onClick={() => setIsCreating(true)}>
              + 추가
            </button>
          </div>

          {isCreating && (
            <div className="preset-form">
              <input
                type="text"
                placeholder="프리셋 이름"
                value={newPresetName}
                onChange={(e) =>
                  setNewPresetName((e.target as HTMLInputElement).value)
                }
                onKeyPress={(e) => e.key === "Enter" && handleCreatePreset()}
              />
              <div className="form-actions">
                <button className="btn-primary" onClick={handleCreatePreset}>
                  생성
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setIsCreating(false);
                    setNewPresetName("");
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          )}

          {presetsLoading ? (
            <div className="loading">로딩중...</div>
          ) : (
            <div className="preset-list">
              {presets?.map((preset) => (
                <div
                  key={preset.preset_id}
                  className={`preset-item ${
                    selectedPresetId === preset.preset_id ? "selected" : ""
                  }`}
                  onClick={() => setSelectedPresetId(preset.preset_id)}
                >
                  {editingPresetId === preset.preset_id ? (
                    <div
                      className="preset-edit-form"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={editingPresetName}
                        onChange={(e) =>
                          setEditingPresetName(
                            (e.target as HTMLInputElement).value
                          )
                        }
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          handleUpdatePreset(preset.preset_id)
                        }
                        autoFocus
                      />
                      <button
                        className="btn-icon"
                        onClick={() => handleUpdatePreset(preset.preset_id)}
                      >
                        ✓
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => {
                          setEditingPresetId(null);
                          setEditingPresetName("");
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="preset-name">{preset.name}</span>
                      <div className="preset-actions">
                        <button
                          className="btn-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPresetId(preset.preset_id);
                            setEditingPresetName(preset.name);
                          }}
                        >
                          ✎
                        </button>
                        <button
                          className="btn-icon btn-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePreset(preset.preset_id);
                          }}
                        >
                          🗑
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="preset-detail-section">
          {selectedPresetId && !detailLoading && presetDetail ? (
            <PresetDetail
              presetDetail={presetDetail}
              users={users?.data || []}
            />
          ) : selectedPresetId && detailLoading ? (
            <div className="loading">로딩중...</div>
          ) : (
            <div className="no-selection">프리셋을 선택하세요</div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PresetDetailProps {
  presetDetail: any;
  users: any[];
}

const POSITIONS = ["TOP", "JUG", "MID", "SUP", "BOT"] as const;

function PresetDetail({ presetDetail, users }: PresetDetailProps) {
  const [showTierForm, setShowTierForm] = useState(false);
  const [newTierName, setNewTierName] = useState("");
  const [editingTierId, setEditingTierId] = useState<number | null>(null);
  const [editingTierName, setEditingTierName] = useState("");
  const [selectedPresetUserId, setSelectedPresetUserId] = useState<
    number | null
  >(null);

  const addPresetUser = useAddPresetUser();
  const updatePresetUser = useUpdatePresetUser();
  const removePresetUser = useRemovePresetUser();
  const addPresetLeader = useAddPresetLeader();
  const removePresetLeader = useRemovePresetLeader();
  const createTier = useCreateTier();
  const updateTier = useUpdateTier();
  const deleteTier = useDeleteTier();
  const addPosition = useAddPosition();
  const deletePosition = useDeletePosition();

  const presetUserIds = new Set(
    presetDetail.preset_users.map((pu: any) => pu.user_id)
  );
  const availableUsers = users.filter(
    (user) => !presetUserIds.has(user.user_id)
  );
  const leaderUserIds = new Set(
    presetDetail.leaders.map((leader: any) => leader.user_id)
  );

  const handleAddUser = async (userId: number) => {
    await addPresetUser.mutateAsync({
      presetId: presetDetail.preset_id,
      userId,
      tierId: null,
    });
  };

  const handleRemoveUser = async (presetUserId: number) => {
    if (!confirm("이 유저를 제거하시겠습니까?")) return;
    await removePresetUser.mutateAsync({
      presetUserId,
      presetId: presetDetail.preset_id,
    });
  };

  const handleToggleLeader = async (userId: number) => {
    const isLeader = leaderUserIds.has(userId);
    if (isLeader) {
      const leader = presetDetail.leaders.find(
        (l: PresetLeader) => l.user_id === userId
      );
      if (leader) {
        await removePresetLeader.mutateAsync({
          presetLeaderId: leader.preset_leader_id,
          presetId: presetDetail.preset_id,
        });
      }
    } else {
      await addPresetLeader.mutateAsync({
        presetId: presetDetail.preset_id,
        userId,
      });
    }
  };

  const handleUpdateTier = async (
    presetUserId: number,
    tierId: number | null
  ) => {
    await updatePresetUser.mutateAsync({
      presetUserId,
      presetId: presetDetail.preset_id,
      tierId,
    });
  };

  const handleTogglePosition = async (
    presetUserId: number,
    position: string
  ) => {
    const presetUser = presetDetail.preset_users.find(
      (pu: any) => pu.preset_user_id === presetUserId
    );
    const hasPosition = presetUser.positions.some(
      (p: any) => p.name === position
    );

    if (hasPosition) {
      const pos = presetUser.positions.find((p: any) => p.name === position);
      await deletePosition.mutateAsync({
        positionId: pos.position_id,
        presetId: presetDetail.preset_id,
      });
    } else {
      // 최대 2개 포지션만 선택 가능
      if (presetUser.positions.length >= 2) {
        alert("포지션은 최대 2개까지만 선택할 수 있습니다.");
        return;
      }
      await addPosition.mutateAsync({
        presetUserId,
        presetId: presetDetail.preset_id,
        name: position,
      });
    }
  };

  const handleCreateTier = async () => {
    if (!newTierName.trim()) return;
    await createTier.mutateAsync({
      presetId: presetDetail.preset_id,
      name: newTierName.trim(),
    });
    setNewTierName("");
    setShowTierForm(false);
  };

  const handleUpdateTierName = async (tierId: number) => {
    if (!editingTierName.trim()) return;
    await updateTier.mutateAsync({
      tierId,
      presetId: presetDetail.preset_id,
      name: editingTierName.trim(),
    });
    setEditingTierId(null);
    setEditingTierName("");
  };

  const handleDeleteTier = async (tierId: number) => {
    if (!confirm("이 티어를 삭제하시겠습니까?")) return;
    await deleteTier.mutateAsync({ tierId, presetId: presetDetail.preset_id });
  };

  const selectedPresetUser = selectedPresetUserId
    ? presetDetail.preset_users.find(
        (pu: any) => pu.preset_user_id === selectedPresetUserId
      )
    : null;

  return (
    <div className="preset-detail">
      <div className="preset-detail-main">
        <h2>{presetDetail.name}</h2>

        {/* 티어 관리 */}
        <div className="detail-section">
          <div className="section-header">
            <h3>티어 관리</h3>
            <button className="btn-small" onClick={() => setShowTierForm(true)}>
              + 티어 추가
            </button>
          </div>

          {showTierForm && (
            <div className="tier-form">
              <input
                type="text"
                placeholder="티어 이름 (예: S, A, B)"
                value={newTierName}
                onChange={(e) =>
                  setNewTierName((e.target as HTMLInputElement).value)
                }
                onKeyPress={(e) => e.key === "Enter" && handleCreateTier()}
              />
              <button className="btn-primary" onClick={handleCreateTier}>
                생성
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowTierForm(false);
                  setNewTierName("");
                }}
              >
                취소
              </button>
            </div>
          )}

          <div className="tier-list">
            {presetDetail.tiers?.map((tier: any) => (
              <div key={tier.tier_id} className="tier-item">
                {editingTierId === tier.tier_id ? (
                  <>
                    <input
                      type="text"
                      value={editingTierName}
                      onChange={(e) =>
                        setEditingTierName((e.target as HTMLInputElement).value)
                      }
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleUpdateTierName(tier.tier_id)
                      }
                      autoFocus
                    />
                    <button onClick={() => handleUpdateTierName(tier.tier_id)}>
                      ✓
                    </button>
                    <button
                      onClick={() => {
                        setEditingTierId(null);
                        setEditingTierName("");
                      }}
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <>
                    <span className="tier-badge">{tier.name}</span>
                    <button
                      onClick={() => {
                        setEditingTierId(tier.tier_id);
                        setEditingTierName(tier.name);
                      }}
                    >
                      ✎
                    </button>
                    <button onClick={() => handleDeleteTier(tier.tier_id)}>
                      🗑
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 플레이어 카드 그리드 */}
        <div className="detail-section">
          <div className="section-header">
            <h3>플레이어 ({presetDetail.preset_users.length}명)</h3>
          </div>

          <div className="player-grid">
            {presetDetail.preset_users.map((presetUser: any) => {
              const isLeader = leaderUserIds.has(presetUser.user_id);
              const tierName = presetUser.tier_id
                ? presetDetail.tiers?.find(
                    (t: any) => t.tier_id === presetUser.tier_id
                  )?.name
                : null;
              const positions =
                presetUser.positions?.map((p: any) => p.name) || [];

              return (
                <div
                  key={presetUser.preset_user_id}
                  className={`player-card-compact ${
                    selectedPresetUserId === presetUser.preset_user_id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedPresetUserId(presetUser.preset_user_id)
                  }
                >
                  <UserCard
                    nickname={presetUser.user.nickname}
                    riot_nickname={presetUser.user.riot_nickname}
                  />
                  <div className="player-badges">
                    {tierName && (
                      <div
                        className="badge-icon tier-badge"
                        title={`티어: ${tierName}`}
                      >
                        {tierName}
                      </div>
                    )}
                    {isLeader && (
                      <div className="badge-icon leader-badge" title="리더">
                        👑
                      </div>
                    )}
                    {positions.map((pos: string) => (
                      <div
                        key={pos}
                        className="badge-icon position-badge"
                        title={`포지션: ${pos}`}
                      >
                        {pos.charAt(0)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 플레이어 추가 */}
        <div className="detail-section">
          <h3>플레이어 추가</h3>
          <div className="available-players">
            {availableUsers.length === 0 ? (
              <div className="no-players">추가 가능한 플레이어가 없습니다</div>
            ) : (
              availableUsers.map((user) => (
                <div
                  key={user.user_id}
                  className="available-player-card"
                  onClick={() => handleAddUser(user.user_id)}
                >
                  <UserCard
                    nickname={user.nickname}
                    riot_nickname={user.riot_nickname}
                  />
                  <button className="btn-add-player">+</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 플레이어 편집 패널 */}
      {selectedPresetUser && (
        <div className="player-edit-panel">
          <div className="edit-panel-header">
            <h3>{selectedPresetUser.user.nickname}</h3>
            <button
              className="btn-close"
              onClick={() => setSelectedPresetUserId(null)}
            >
              ✕
            </button>
          </div>

          <div className="edit-panel-content">
            <UserCard
              nickname={selectedPresetUser.user.nickname}
              riot_nickname={selectedPresetUser.user.riot_nickname}
            />

            <div className="edit-section">
              <label className="edit-label">
                <input
                  type="checkbox"
                  checked={leaderUserIds.has(selectedPresetUser.user_id)}
                  onChange={() =>
                    handleToggleLeader(selectedPresetUser.user_id)
                  }
                />
                <span>리더로 지정</span>
              </label>
            </div>

            <div className="edit-section">
              <label className="edit-label">티어</label>
              <select
                value={selectedPresetUser.tier_id || ""}
                onChange={(e) =>
                  handleUpdateTier(
                    selectedPresetUser.preset_user_id,
                    (e.target as HTMLSelectElement).value
                      ? parseInt((e.target as HTMLSelectElement).value)
                      : null
                  )
                }
              >
                <option value="">없음</option>
                {presetDetail.tiers?.map((tier: any) => (
                  <option key={tier.tier_id} value={tier.tier_id}>
                    {tier.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="edit-section">
              <label className="edit-label">포지션</label>
              <div className="position-toggles">
                {POSITIONS.map((position) => {
                  const hasPosition = selectedPresetUser.positions?.some(
                    (p: any) => p.name === position
                  );
                  return (
                    <button
                      key={position}
                      className={`position-toggle ${
                        hasPosition ? "active" : ""
                      }`}
                      onClick={() =>
                        handleTogglePosition(
                          selectedPresetUser.preset_user_id,
                          position
                        )
                      }
                    >
                      {position}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              className="btn-danger-full"
              onClick={() => {
                handleRemoveUser(selectedPresetUser.preset_user_id);
                setSelectedPresetUserId(null);
              }}
            >
              플레이어 제거
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
