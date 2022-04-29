package archived

import (
	"github.com/merico-dev/lake/models/common"
	"github.com/merico-dev/lake/plugins/core"
)

type TapdWorkspace struct {
	SourceId    uint64            `gorm:"primaryKey;type:INT(10) UNSIGNED NOT NULL"`
	ID          uint64            `gorm:"primaryKey;type:BIGINT(100)" json:"id,string"`
	Name        string            `gorm:"type:varchar(255)" json:"name"`
	PrettyName  string            `gorm:"type:varchar(255)" json:"pretty_name"`
	Category    string            `gorm:"type:varchar(255)" json:"category"`
	Status      string            `gorm:"type:varchar(255)" json:"status"`
	Description string            `json:"description"`
	BeginDate   *core.Iso8601Time `json:"begin_date"`
	EndDate     *core.Iso8601Time `json:"end_date"`
	ExternalOn  string            `gorm:"type:varchar(255)" json:"external_on"`
	Creator     string            `gorm:"type:varchar(255)" json:"creator"`
	Created     *core.Iso8601Time `json:"created"`
	common.NoPKModel
}

type TapdWorkSpaceIssue struct {
	SourceId    uint64 `gorm:"primaryKey"`
	WorkspaceID uint64 `gorm:"primaryKey"`
	IssueId     uint64 `gorm:"primaryKey"`
	common.NoPKModel
}

func (TapdWorkspace) TableName() string {
	return "_tool_tapd_workspaces"
}

func (TapdWorkSpaceIssue) TableName() string {
	return "_tool_tapd_workspace_issues"
}
