
/**
 * 一款基于jQuery的轻量级可编辑表格插件，适用于快速录单等应用场景，支持键盘操作
 * 
 * @package  funsent
 * @link     http://www.funsent.com
 * @license  https://opensource.org/licenses/MIT/
 * @author   yanggf <2018708@qq.com>
 * @version  0.0.1
 */

; (function ($, global) {
    let defaults = {
        // 表格元素
        table_target: null,
        // 空表格时为可编辑行数，非空表格时为多出的可编辑行数
        row_number: 0,
        // 空表格时为可编辑列数
        column_number: 0,
        // 启用键盘操作，适用快速录单等场景
        enable_keyboard: false,
        // 焦点在最后一个元素上时按TAB键插入新行，enable_keyboard为true时有效
        enable_tab_insert: false,
        // 启用操作按钮
        enable_button: false,
        // 不启用编辑的行索引, 如果为数字，表示前几行都不启用编辑
        no_edit_rows: [],
        // 自定义列数组
        columns: [
            // 复选框类型，此时width、height、align等字段无效，且永远水平居中    
            // {type:'checkbox', name:'', value:'', width:'100%', height:'100%', align:'', readonly:false},
            // 文本类型，默认的类型
            // {type:'text', name:'', value:'', width:'100%', height:'100%', align:'', readonly:false},
            // select多出一个下拉数据源的字段values，且必须为数组形式给出
            // {type:'select', name:'', value:'', width:'100%', height:'100%', align:'', readonly:false, values:[]},
            // 日期类型，一种点击弹出日期选择框的文本类型
            // {type:'date', name:'', value:'', width:'100%', height:'100%', align:'', readonly:true},
            // 整数类型，positive字段确定是否只能为正数，negtive字段确定是否只能为负数，zero字段确定是否包含0。待实现
            // {type:'integer', positive:true, negtive:false, zero:true, name:'', value:'', width:'100%', height:'100%', align:'', readonly:false},
            // 数字类型，positive字段确定是否只能为正数，negtive字段确定是否只能为负数，zero字段确定是否允许包含0。待实现
            // {type:'number', positive:true, negtive:false, zero:true, name:'', value:'', width:'100%', height:'100%', align:'', readonly:false},
        ],
    };

    // 配置参数
    let configs = {};
    // 已存在的行
    let oldDataRows = [];
    // 可编辑的所有行
    let editableRows = [];

    // 插件主体
    let etable = {
        // 参数配置
        config: function (opts) {
            if (typeof opts === 'string') {
                return configs[opts];
            } else if (typeof opts === 'undefined') {
                return configs;
            }
            if (!this.isJsonObject(opts)) {
                configs = defaults;
                return configs;
            }
            configs = Object.assign({}, defaults, opts);
            return configs;
        },

        // 初始化
        init: function (opts) {
            this.config(opts);
            this.resetOldDataRows();
            this.resetEditableRows();
            this.render();
            this.setToolBtns();
            this.setKeyboard();
        },

        resetOldDataRows: function () {
            oldDataRows = [];
        },
        getOldDataRows: function () {
            return oldDataRows;
        },
        getOldDataRow: function (index) {
            return oldDataRows[index] || undefined;
        },
        setOldDataRow: function ($row) {
            oldDataRows.push($row);
        },

        resetEditableRows: function () {
            editableRows = [];
        },
        getEditableRows: function () {
            return editableRows;
        },
        getEditableRow: function (index) {
            return editableRows[index] || undefined;
        },
        setEditableRow: function ($row) {
            editableRows.push($row);
        },
        insertEditableRow: function (index, direct) {
            let $row = editableRows[index];
            if ($row) {
                let $target = $(this.config('table_target')),
                    $tbody = $target.find('tbody');
                let i = editableRows.length + 1;
                let $tds = $row.find('td'), columnCnt = $tds.length;
                let $tr = $('<tr></tr>');
                for (let j = 0; j < columnCnt; j++) {
                    let $td = $('<td></td>'), textValue = '', textAlign = $tds.eq(j).css('textAlign');
                    let $editor = this.editor('insert', i, j, textValue, textAlign);
                    $td.html($editor).css({ padding: 0, textAlign: textAlign });
                    $tr.append($td);
                }
                if (direct == 'after') {
                    $tbody.find('tr:eq(' + index + ')').after($tr);
                    editableRows.splice(index + 1, 0, $tr);
                } else if (direct == 'before') {
                    $tbody.find('tr:eq(' + index + ')').before($tr);
                    editableRows.splice(index, 0, $tr);
                }
            }
        },
        removeEditableRow: function (index) {
            let $row = editableRows[index];
            if ($row) {
                $row.remove();
                editableRows.splice(index, 1);
            }
        },

        // 渲染表格单元格为编辑器
        render: function () {
            let $target = $(this.config('table_target')),
                $thead = $target.find('thead'),
                $tbody = $target.find('tbody');

            let $rows = $tbody.find('tr'),
                rowCnt = $rows.size(),
                columnCnt = $thead.find('tr > th').size();

            let textAligns = [];

            // 已有行变成可编辑行
            let noEditRows = this.config('no_edit_rows');
            if (rowCnt > 0 && columnCnt > 0) {
                for (let i = 0; i < rowCnt; i++) {

                    let $tr = $rows.eq(i);
                    this.setOldDataRow($tr);

                    if (this.isArray(noEditRows)) {
                        // 行索引数组
                        if (this.inArray(i, noEditRows)) {
                            continue;
                        }
                    } else if (typeof noEditRows === 'number') {
                        // 前几行
                        if (i < Math.ceil(noEditRows)) {
                            continue;
                        }
                    }

                    let $tds = $tr.find('td');
                    for (let j = 0; j < columnCnt; j++) {
                        let $td = $tds.eq(j), textValue = $td.text(), textAlign = $td.css('textAlign');
                        let $editor = this.editor('modify', i, j, textValue, textAlign);
                        $td.html($editor).css({ padding: 0, textAlign: textAlign });

                        // 临时保存该列td原有的对齐方式
                        textAligns[j] = textAlign;
                    }

                    this.setEditableRow($tr);
                }
            }

            // 新编辑行
            if (rowCnt = this.config('row_number')) {
                if (columnCnt == 0) {
                    columnCnt = this.config('column_number');
                }
                for (let i = 0; i < rowCnt; i++) {
                    let $tr = $('<tr></tr>');
                    for (let j = 0; j < columnCnt; j++) {
                        let column = this.config('columns')[j] || {}, columnAlign = column['align'] || '';
                        let $td = $('<td></td>'), textValue = '', textAlign = textAligns[j] || columnAlign;
                        let $editor = this.editor('insert', i, j, textValue, textAlign);
                        $td.html($editor).css({ padding: 0, textAlign: textAlign });
                        $tr.append($td);
                    }
                    $tbody.append($tr);

                    // 保存行
                    this.setEditableRow($tr);
                }
            }
        },

        // 序列化表格数据，返回json对象数组的表单数据
        serializeArray: function () {
            let arr = [];
            let rows = this.getEditableRows();
            if (!rows.length) {
                return arr;
            }

            let editableEles = 'input,select,textarea';
            for (let key in rows) {
                let $columns = rows[key].find('td');
                let inputs = {};
                $columns.each(function () {
                    let $childrens = $(this).children(editableEles);
                    if ($childrens.length) {
                        let $children = $childrens.eq(0);
                        let key = $children.prop('name');
                        let value = $children.val();
                        inputs[key] = value;
                    }
                });
                arr.push(inputs);
            }

            return arr;
        },

        // 设置键盘操作
        setKeyboard: function () {
            if (!this.config('enable_keyboard')) {
                return;
            }

            let rows = this.getEditableRows(), rowCnt = rows.length;
            if (!rowCnt) {
                return;
            }

            // 所有编辑元素、所有编辑元素个数、每行可编辑元素的列数
            let editableEles = 'input,select,textarea';
            let inputs = [], inputCnt = 0;
            for (let key in rows) {
                let row = rows[key];
                let $columns = row.find('td');
                $columns.each(function () {
                    let $childrens = $(this).children(editableEles);
                    if ($childrens.length) {
                        inputs.push($childrens.eq(0));
                        inputCnt++;
                    }
                });
            }
            let editableColumnCnt = inputCnt / rowCnt;

            let that = this;
            for (let i = 0; i < inputCnt; i++) {
                let $input = inputs[i], index = i;
                $input.unbind('keydown').bind('keydown', function (e) {
                    let k = e.keyCode;

                    if (k == 32) {
                        // 空格键按下时，如果碰到日期选择框，则触发click事件，以便能够弹出日期选择框
                        if ($input.hasClass('funsent-etable-input-date')) {
                            $input.trigger('click');
                        }
                        return;
                    }

                    if (k == 9 || k == 39 || k == 13) {
                        // 焦点在最后一个元素上时按TAB键插入新行，enable_keyboard为true时有效
                        if (k == 9 && that.config('enable_tab_insert') && index == inputCnt - 1) {
                            let rowIndex = rowCnt - 1;
                            that.insertEditableRow(rowIndex, 'after');
                            that.setToolBtns();
                            that.resetOrder();
                            that.setKeyboard();
                            return;
                        }
                        // TAB键、右方向键和回车键
                        if (index < inputCnt - 1) {
                            let tmpIndex = index + 1, $input = inputs[tmpIndex];
                            $input.focus();
                            if ($input.prop('tagName').toLowerCase() != 'select') {
                                $input.select();
                            }
                        }
                        // 修复问题：1.防止TAB键时跳2次；2.防止右方向键改变select的值
                        (k == 9 || k == 39) && e.preventDefault();
                    } else if (k == 37) {
                        // 左方向键
                        if (index >= 1) {
                            let tmpIndex = index - 1, $input = inputs[tmpIndex];
                            $input.focus();
                            if ($input.prop('tagName').toLowerCase() != 'select') {
                                $input.select();
                            }
                        }
                        // 修复问题：1.防止左方向键改变select的值 
                        e.preventDefault();
                    } else if (k == 38) {
                        // 上方向键
                        // 计算上一行同一个位置的索引
                        let tmpIndex = index - editableColumnCnt;
                        if (tmpIndex >= 0) {
                            let $input = inputs[tmpIndex];
                            $input.focus();
                            if ($input.prop('tagName').toLowerCase() != 'select') {
                                $input.select();
                            }
                        }
                        // 修复问题：1.防止上方向键改变select的值
                        e.preventDefault();
                    } else if (k == 40) {
                        // 下方向键
                        // 计算下一行同一个位置的索引
                        let tmpIndex = index + editableColumnCnt;
                        if (tmpIndex <= inputCnt - 1) {
                            let $input = inputs[tmpIndex];
                            $input.focus();
                            if ($input.prop('tagName').toLowerCase() != 'select') {
                                $input.select();
                            }
                        }
                        // 修复问题：1.防止下方向键改变select的值
                        e.preventDefault();
                    }
                });
            }
        },

        // 设置工具按钮
        setToolBtns: function () {
            let rows = this.getEditableRows(), rowCnt = rows.length;
            if (!this.config('enable_button') || !rowCnt) {
                return;
            }

            let btnPseudoStyle = '<style>.funsent-etable-btn:active{positon:relative;left:1px;top:1px;}</style>',
                btnCss = {
                    fontSize: '12px',
                    width: '14px',
                    height: '14px',
                    display: 'inline-block',
                    textAlign: 'center',
                    backgroundColor: '#eff8fd',
                    color: '#06f',
                    padding: '0',
                    margin: '0 2px 0 0',
                    border: '1px solid #06f',
                    boxSizing: 'border-box',
                    borderRadius: '2px',
                    boxShadow: '0 0 2px 0 #999',
                    cursor: 'pointer'
                },
                groupCss = {
                    position: 'absolute',
                    left: '2px',
                    boxSizing: 'border-box',
                    display: 'block',
                    padding: '0',
                    margin: '0',
                    width: '48px',
                    height: '16px',
                    overflow: 'hidden',
                    backgroundColor: 'transparent',
                    opacity: 0.3
                };

            const over = function () {
                $(this).css({ backgroundColor: '#06f', color: '#eff8fd' });
            };
            const out = function () {
                $(this).css({ backgroundColor: '#eff8fd', color: '#06f' });
            };

            let $target = $(this.config('table_target')), $thead = $target.find('thead'), theadHeight = $thead.outerHeight();
            let $parent = $target.closest('div').css('position', 'relative');

            // 删除之前的所有工具按钮
            $parent.find('div.funsent-etable-btnGroup').remove();

            let that = this;
            for (let i = 0; i < rowCnt; i++) {

                let $btn1 = $('<a class="funsent-etable-btn" href="javascript:;" title="上方插入新行">▲</a>').css(btnCss).hover(over, out),
                    $btn2 = $('<a class="funsent-etable-btn" href="javascript:;" title="下方插入新行">▼</a>').css(btnCss).hover(over, out),
                    $btn3 = $('<a class="funsent-etable-btn" href="javascript:;" title="删除当前行">✂</a>').css(btnCss).hover(over, out);

                let $row = rows[i], top = theadHeight + ($row.outerHeight() * i) + 2;
                let $group = $('<div class="funsent-etable-btnGroup"></div>').css(groupCss).append(btnPseudoStyle, $btn1, $btn2, $btn3);
                $group.css('top', top);

                // 上方插入新行
                $btn1.bind('click', function () {
                    that.insertEditableRow(i, 'before');
                    that.setToolBtns();
                    that.resetOrder();
                    that.setKeyboard();
                });
                // 下方插入新行
                $btn2.bind('click', function () {
                    that.insertEditableRow(i, 'after');
                    that.setToolBtns();
                    that.resetOrder();
                    that.setKeyboard();
                });
                // 删除当前行
                $btn3.bind('click', function () {
                    if (that.getEditableRows().length == 1) {
                        layer.msg('不能删除唯一行');
                        return;
                    }
                    $group.remove();
                    that.removeEditableRow(i);
                    that.setToolBtns();
                    that.resetOrder();
                    that.setKeyboard();
                });

                $group.appendTo($parent);
            }
        },

        // 重置行序号
        resetOrder: function () {
            let columns = this.config('columns')

            // 没有序号列
            if (!this.isArray(columns)) {
                return;
            }
            let length = columns.length;
            if (length == 0) {
                return;
            }

            // 计算哪几列是序号列
            let orderColumns = [];
            for (let i = 0; i < length; i++) {
                let column = columns[i];
                if (typeof column === 'number') {
                    orderColumns.push(i);
                }
            }

            // 序号值重新按连续数字显示
            let rows = this.getEditableRows();
            let rowCnt = rows.length, columnCnt = rows[0].find('td').length;
            for (let i = 0; i < rowCnt; i++) {
                for (let j = 0; j < columnCnt; j++) {
                    if (this.inArray(j, orderColumns)) {
                        let $td = rows[i].find('td:eq(' + j + ')');
                        $td.html(this.renderOrder(i + 1));
                    }
                }
            }
        },

        // 返回序号列内容
        renderOrder: function (order) {
            return '<div style="text-align:center;">' + order + '</div>';
        },

        // 是否为数组
        isArray: function (obj) {
            return (typeof obj === 'object' && JSON.stringify(obj).indexOf('[') == 0);
        },

        // 元素是否在数组中
        inArray: function (value, arr) {
            if (!this.isArray(arr)) {
                return false;
            }
            return arr.indexOf(value) !== -1;
        },

        // 是否为json对象
        isJsonObject: function (obj) {
            return (typeof obj === 'object' && JSON.stringify(obj).indexOf('{') == 0);
        },

        // 是否为空的json对象
        isEmptyJsonObject: function (obj) {
            if (!this.isJsonObject(obj)) {
                return false;
            }
            return JSON.stringify(obj) == '{}';
        },

        // 创建编辑器，参数分别为：模式（修改行还是插入行），行索引，列索引，列原始数据，列原始对其方式
        editor: function (mode, rowIndex, colIndex, textValue, textAlign) {
            let columns = this.config('columns'), column = columns[colIndex];

            // 布尔型表示不编辑，仅显示空字符串
            // 数字型表示不编辑，仅显示序号
            // 字符型表示不编辑，仅直接显示该字符串
            if (typeof column === 'boolean') {
                return '';
            } else if (typeof column === 'number') {
                let oldDataRowCnt = this.getOldDataRows().length, order = 1;
                if (mode == 'modify') {
                    order = oldDataRowCnt;
                } else if (mode == 'insert') {
                    order = oldDataRowCnt + rowIndex + 1;
                }
                return this.renderOrder(order);
            } else if (typeof column === 'string') {
                return column;
            }

            // 判断是否为json对象
            if (!this.isJsonObject(column)) {
                column = {};
            }

            let style = {
                width: '100%',
                height: '100%',
                textAlign: textAlign,
                boxSizing: 'border-box'
            };

            // 空的JSON对象
            if (JSON.stringify(column) == '{}') {
                let name = this.config('table_target') + '_row' + rowIndex + '_col' + colIndex,
                    value = textValue;
                return this.textEditor(name, value, column, style);
            }

            let type = column['type'] || 'text',
                name = column['name'] || '',
                value = textValue || (column['value'] || '');

            // 样式覆盖
            style = Object.assign({}, style, column['style'] || {});
            style['width'] = column['width'] || '100%';
            style['height'] = column['height'] || '100%';
            style['textAlign'] = textAlign || (column['align'] || '');

            let $editor;
            if (type == 'date') {
                $editor = this.dateEditor(name, value, column, style);
            } else if (type == 'select') {
                $editor = this.selectEditor(name, value, column, style);
            } else if (type == 'checkbox') {
                $editor = this.checkboxEditor(name, value, column, style);
            } else {
                $editor = this.textEditor(name, value, column, style);
            }
            return $editor;
        },

        // 文本框
        textEditor: function (name, value, column, style) {
            let readonly = column['readonly'] || false;
            let $editor = $('<input type="text" name="' + name + '" value="' + value + '" />').css(style).prop('readonly', readonly);
            return $editor;
        },

        // 下拉选择框
        selectEditor: function (name, value, column, style) {
            let readonly = column['readonly'] || false;
            let values = column['values'] || [];
            let options = '<option value=""></option>', optionValueCnt = 0;
            if (typeof values === 'object') {
                for (let v in values) {
                    let selected = (value == v ? ' selected="selected"' : '');
                    let text = values[v];
                    options += '<option value="' + v + '"' + selected + '>' + text + '</option>';
                    optionValueCnt++;
                }
            }
            let $editor = $('<select name="' + name + '">' + options + '</select>').css(style).prop('readonly', readonly);
            return $editor;
        },

        // 复选框
        checkboxEditor: function (name, value, column, style) {
            let readonly = column['readonly'] || false;
            let $checkbox = $('<input type="checkbox" name="' + name + '" value="' + value + '" />').prop('readonly', readonly);
            let $editor = $('<div class="checkbox"><label></label></div>').css('textAlign', 'center').prepend($checkbox);
            return $editor;
        },

        // 日期选择框
        dateEditor: function (name, value, column, style) {
            let readonly = column['readonly'] || true;
            let $editor = $('<input class="funsent-etable-input-date" type="text" name="' + name + '" value="' + value + '" />').css(style).prop('readonly', readonly);
            laydate.render({ elem: $editor.get(0) });
            return $editor;
        },

        //TODO 整数框
        integerEditor: function (name, value, column, style) { },

        //TODO 数字框（含小数）
        numberEditor: function (name, value, column, style) { }
    };

    // 插件对象暴露出去
    !('funsent' in global) && (global.funsent = {});
    !('etable' in global.funsent) && (global.funsent.etable = etable);
})(jQuery, window);
