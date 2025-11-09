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
import "./preset.css";

export function Preset() {
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [editingPresetId, setEditingPresetId] = useState<number | null>(null);
  const [editingPresetName, setEditingPresetName] = useState("");

  // Queries
  const { data: presets, isLoading: presetsLoading } = usePresets();
  const { data: users } = useUsers();
  const { data: presetDetail, isLoading: detailLoading } =
    usePresetDetail(selectedPresetId);

  // Mutations
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
        {/* 왼쪽: Preset 목록 */}
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

        {/* 오른쪽: Preset 상세 설정 */}
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

function PresetDetail({ presetDetail, users }: PresetDetailProps) {
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [showTierForm, setShowTierForm] = useState(false);
  const [newTierName, setNewTierName] = useState("");
  const [editingTierId, setEditingTierId] = useState<number | null>(null);
  const [editingTierName, setEditingTierName] = useState("");
  const [showPositionForm, setShowPositionForm] = useState<number | null>(null);
  const [newPositionName, setNewPositionName] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedTierId, setSelectedTierId] = useState<number | null>(null);

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

  const handleAddUser = async () => {
    if (!selectedUserId || !selectedTierId) {
      alert("유저와 티어를 모두 선택해주세요.");
      return;
    }
    await addPresetUser.mutateAsync({
      presetId: presetDetail.preset_id,
      userId: selectedUserId,
      tierId: selectedTierId,
    });
    setShowUserSelector(false);
    setSelectedUserId(null);
    setSelectedTierId(null);
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
    await deleteTier.mutateAsync({
      tierId,
      presetId: presetDetail.preset_id,
    });
  };

  const handleAddPosition = async (presetUserId: number) => {
    if (!newPositionName.trim()) return;
    await addPosition.mutateAsync({
      presetUserId,
      presetId: presetDetail.preset_id,
      name: newPositionName.trim(),
    });
    setNewPositionName("");
    setShowPositionForm(null);
  };

  const handleDeletePosition = async (positionId: number) => {
    await deletePosition.mutateAsync({
      positionId,
      presetId: presetDetail.preset_id,
    });
  };

  return (
    <div className="preset-detail">
      <h2>{presetDetail.name} 설정</h2>

      {/* Tier 관리 */}
      <div className="detail-section">
        <div className="section-header">
          <h3>티어</h3>
          <button className="btn-small" onClick={() => setShowTierForm(true)}>
            + 추가
          </button>
        </div>

        {showTierForm && (
          <div className="tier-form">
            <input
              type="text"
              placeholder="티어 이름 (예: S, A, B, C)"
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
                  <div className="tier-actions">
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
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 유저 목록 */}
      <div className="detail-section">
        <div className="section-header">
          <h3>참가 유저</h3>
          <button
            className="btn-small"
            onClick={() => setShowUserSelector(true)}
          >
            + 추가
          </button>
        </div>

        {showUserSelector && (
          <div className="user-selector">
            <div className="selector-header">
              <h4>유저 선택</h4>
              <button onClick={() => setShowUserSelector(false)}>✕</button>
            </div>

            <div className="user-selector-form">
              <div className="form-field">
                <label>유저:</label>
                <select
                  value={selectedUserId || ""}
                  onChange={(e) =>
                    setSelectedUserId(
                      (e.target as HTMLSelectElement).value
                        ? parseInt((e.target as HTMLSelectElement).value)
                        : null
                    )
                  }
                >
                  <option value="">선택하세요</option>
                  {availableUsers.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.nickname} ({user.riot_nickname})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>티어:</label>
                <select
                  value={selectedTierId || ""}
                  onChange={(e) =>
                    setSelectedTierId(
                      (e.target as HTMLSelectElement).value
                        ? parseInt((e.target as HTMLSelectElement).value)
                        : null
                    )
                  }
                >
                  <option value="">선택하세요</option>
                  {presetDetail.tiers?.map((tier: any) => (
                    <option key={tier.tier_id} value={tier.tier_id}>
                      {tier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button className="btn-primary" onClick={handleAddUser}>
                  추가
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowUserSelector(false);
                    setSelectedUserId(null);
                    setSelectedTierId(null);
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="preset-users-list">
          {presetDetail.preset_users.map((presetUser: any) => (
            <div key={presetUser.preset_user_id} className="preset-user-card">
              <div className="user-header">
                <div className="user-info">
                  <span className="user-name">{presetUser.user.nickname}</span>
                  <span className="riot-name">
                    {presetUser.user.riot_nickname}
                  </span>
                </div>
                <div className="user-controls">
                  <label className="leader-toggle">
                    <input
                      type="checkbox"
                      checked={leaderUserIds.has(presetUser.user_id)}
                      onChange={() => handleToggleLeader(presetUser.user_id)}
                    />
                    <span>리더</span>
                  </label>
                  <button
                    className="btn-icon btn-danger"
                    onClick={() => handleRemoveUser(presetUser.preset_user_id)}
                  >
                    🗑
                  </button>
                </div>
              </div>

              {/* 티어 선택 */}
              <div className="user-tier">
                <label>티어:</label>
                <select
                  value={presetUser.tier_id || ""}
                  onChange={(e) =>
                    handleUpdateTier(
                      presetUser.preset_user_id,
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

              {/* 포지션 관리 */}
              <div className="user-positions">
                <label>포지션:</label>
                <div className="position-list">
                  {presetUser.positions?.map((position: any) => (
                    <div key={position.position_id} className="position-tag">
                      <span>{position.name}</span>
                      <button
                        className="btn-remove"
                        onClick={() =>
                          handleDeletePosition(position.position_id)
                        }
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {showPositionForm === presetUser.preset_user_id ? (
                    <div className="position-form">
                      <input
                        type="text"
                        placeholder="포지션 (예: TOP)"
                        value={newPositionName}
                        onChange={(e) =>
                          setNewPositionName(
                            (e.target as HTMLInputElement).value
                          )
                        }
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          handleAddPosition(presetUser.preset_user_id)
                        }
                        autoFocus
                      />
                      <button
                        onClick={() =>
                          handleAddPosition(presetUser.preset_user_id)
                        }
                      >
                        +
                      </button>
                      <button
                        onClick={() => {
                          setShowPositionForm(null);
                          setNewPositionName("");
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn-add-position"
                      onClick={() =>
                        setShowPositionForm(presetUser.preset_user_id)
                      }
                    >
                      + 포지션 추가
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
