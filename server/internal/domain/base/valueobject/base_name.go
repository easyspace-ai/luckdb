package valueobject

import "errors"

// BaseName Base名称值对象
type BaseName struct {
	value string
}

// NewBaseName 创建Base名称
func NewBaseName(name string) (*BaseName, error) {
	if name == "" {
		return nil, errors.New("base name cannot be empty")
	}

	if len(name) > 100 {
		return nil, errors.New("base name too long (max 100 chars)")
	}

	return &BaseName{value: name}, nil
}

// String 获取名称值
func (n *BaseName) String() string {
	return n.value
}

// Equals 比较是否相等
func (n *BaseName) Equals(other *BaseName) bool {
	if other == nil {
		return false
	}
	return n.value == other.value
}
