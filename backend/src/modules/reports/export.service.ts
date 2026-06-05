import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  private styleHeader(ws: ExcelJS.Worksheet, row: number, cols: number) {
    const r = ws.getRow(row);
    r.eachCell({ includeEmpty: true }, (cell, i) => {
      if (i > cols) return;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' },
      };
    });
    r.height = 22;
  }

  private styleDataRow(row: ExcelJS.Row, isEven: boolean) {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFF5F5FF' : 'FFFFFFFF' } };
      cell.border = {
        top: { style: 'hair' }, bottom: { style: 'hair' },
        left: { style: 'hair' }, right: { style: 'hair' },
      };
      cell.alignment = { vertical: 'middle' };
    });
    row.height = 18;
  }

  async exportStudents(): Promise<Buffer> {
    const students = await this.prisma.student.findMany({
      include: {
        user: true,
        groupMembers: { include: { group: { include: { course: true } } }, where: { isActive: true } },
        payments: { select: { status: true, paidAmount: true, debt: true } },
        attendance: { select: { status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'EduCRM Pro';
    wb.created = new Date();

    const ws = wb.addWorksheet("O'quvchilar", { pageSetup: { orientation: 'landscape' } });
    ws.columns = [
      { key: 'no',       header: '№',            width: 5  },
      { key: 'name',     header: 'Ism Familiya', width: 22 },
      { key: 'email',    header: 'Email',         width: 24 },
      { key: 'phone',    header: 'Telefon',       width: 16 },
      { key: 'gender',   header: 'Jinsi',         width: 10 },
      { key: 'address',  header: 'Manzil',        width: 22 },
      { key: 'groups',   header: 'Guruhlar',      width: 28 },
      { key: 'paid',     header: "To'langan",     width: 14 },
      { key: 'debt',     header: 'Qarz',          width: 14 },
      { key: 'attend',   header: 'Davomat %',     width: 12 },
      { key: 'status',   header: 'Holati',        width: 10 },
      { key: 'joined',   header: "Qo'shildi",     width: 14 },
    ];

    ws.addRow(['№', 'Ism Familiya', 'Email', 'Telefon', 'Jinsi', 'Manzil',
      'Guruhlar', "To'langan", 'Qarz', 'Davomat %', 'Holati', "Qo'shildi"]);
    this.styleHeader(ws, 1, 12);

    students.forEach((s, i) => {
      const att = s.attendance;
      const rate = att.length ? Math.round((att.filter(a => a.status === 'PRESENT').length / att.length) * 100) : 0;
      const paid = s.payments.reduce((sum, p) => sum + Number(p.paidAmount), 0);
      const debt = s.payments.reduce((sum, p) => sum + Number(p.debt), 0);
      const row = ws.addRow({
        no:      i + 1,
        name:    `${s.user.firstName} ${s.user.lastName}`,
        email:   s.user.email,
        phone:   s.user.phone || '-',
        gender:  s.gender === 'MALE' ? 'Erkak' : s.gender === 'FEMALE' ? 'Ayol' : '-',
        address: s.address || '-',
        groups:  s.groupMembers.map(m => m.group.name).join(', ') || '-',
        paid:    paid.toLocaleString('uz-UZ') + " so'm",
        debt:    debt > 0 ? debt.toLocaleString('uz-UZ') + " so'm" : '-',
        attend:  rate + '%',
        status:  s.user.status === 'ACTIVE' ? 'Faol' : 'Nofaol',
        joined:  new Date(s.createdAt).toLocaleDateString('uz-UZ'),
      });
      this.styleDataRow(row, i % 2 === 1);
    });

    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf as unknown as ArrayBuffer);
  }

  async exportPayments(month?: number, year?: number, groupId?: string): Promise<Buffer> {
    const where: any = {};
    if (month) where.month = month;
    if (year) where.year = year;
    if (groupId) where.groupId = groupId;

    const payments = await this.prisma.payment.findMany({
      where,
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
        group: { include: { course: { select: { name: true } } } },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'EduCRM Pro';
    const ws = wb.addWorksheet("To'lovlar");
    ws.columns = [
      { key: 'no',      header: '№',            width: 5  },
      { key: 'student', header: "O'quvchi",     width: 22 },
      { key: 'phone',   header: 'Telefon',       width: 16 },
      { key: 'course',  header: 'Kurs',          width: 18 },
      { key: 'group',   header: 'Guruh',         width: 20 },
      { key: 'month',   header: 'Oy/Yil',        width: 12 },
      { key: 'amount',  header: 'Jami summa',    width: 14 },
      { key: 'paid',    header: "To'langan",     width: 14 },
      { key: 'debt',    header: 'Qarz',          width: 14 },
      { key: 'method',  header: 'Usul',          width: 12 },
      { key: 'status',  header: 'Holati',        width: 14 },
      { key: 'dueDate', header: 'Muddat',        width: 12 },
    ];

    const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
    const statusMap: Record<string, string> = { PAID: "To'langan", PENDING: 'Kutilmoqda', PARTIAL: 'Qisman', OVERDUE: "Muddati o'tgan" };
    const methodMap: Record<string, string> = { CASH: 'Naqd', CARD: 'Karta', BANK_TRANSFER: 'Bank', ONLINE: 'Online' };

    ws.addRow(['№', "O'quvchi", 'Telefon', 'Kurs', 'Guruh', 'Oy/Yil', 'Jami summa', "To'langan", 'Qarz', 'Usul', 'Holati', 'Muddat']);
    this.styleHeader(ws, 1, 12);

    payments.forEach((p, i) => {
      const row = ws.addRow({
        no:      i + 1,
        student: `${p.student.user.firstName} ${p.student.user.lastName}`,
        phone:   p.student.user.phone || '-',
        course:  p.group.course.name,
        group:   p.group.name,
        month:   `${months[p.month - 1]} ${p.year}`,
        amount:  Number(p.amount),
        paid:    Number(p.paidAmount),
        debt:    Number(p.debt),
        method:  methodMap[p.method] || p.method,
        status:  statusMap[p.status] || p.status,
        dueDate: new Date(p.dueDate).toLocaleDateString('uz-UZ'),
      });
      this.styleDataRow(row, i % 2 === 1);
      // Status rangini belgilash
      const statusCell = row.getCell('status');
      if (p.status === 'PAID') statusCell.font = { color: { argb: 'FF16A34A' }, bold: true };
      else if (p.status === 'OVERDUE') statusCell.font = { color: { argb: 'FFDC2626' }, bold: true };
      else if (p.status === 'PARTIAL') statusCell.font = { color: { argb: 'FF2563EB' } };
    });

    // Jami summa
    const totalRow = ws.addRow({
      no: '', student: 'JAMI:', phone: '', course: '', group: '', month: '',
      amount: payments.reduce((s, p) => s + Number(p.amount), 0),
      paid:   payments.reduce((s, p) => s + Number(p.paidAmount), 0),
      debt:   payments.reduce((s, p) => s + Number(p.debt), 0),
      method: '', status: '', dueDate: '',
    });
    totalRow.font = { bold: true };
    totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF0FF' } };

    ws.getColumn('amount').numFmt = '#,##0';
    ws.getColumn('paid').numFmt = '#,##0';
    ws.getColumn('debt').numFmt = '#,##0';

    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf as unknown as ArrayBuffer);
  }

  async exportAttendance(groupId: string): Promise<Buffer> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        course: true,
        members: {
          where: { isActive: true },
          include: {
            student: {
              include: {
                user: { select: { firstName: true, lastName: true } },
                attendance: { where: { groupId }, orderBy: { date: 'asc' } },
              },
            },
          },
        },
      },
    });
    if (!group) throw new Error('Group not found');

    const allDates = [...new Set(
      group.members.flatMap(m => m.student.attendance.map(a => a.date.toISOString().split('T')[0]))
    )].sort() as string[];

    const wb = new ExcelJS.Workbook();
    wb.creator = 'EduCRM Pro';
    const ws = wb.addWorksheet('Davomat');

    const cols: Partial<ExcelJS.Column>[] = [
      { key: 'no',   header: '№',            width: 5  },
      { key: 'name', header: 'Ism Familiya', width: 22 },
      ...allDates.map(d => ({
        key: d, header: new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' }), width: 8,
      })),
      { key: 'total',   header: 'Jami',     width: 7  },
      { key: 'present', header: 'Keldi',    width: 7  },
      { key: 'absent',  header: 'Kelmadi',  width: 8  },
      { key: 'rate',    header: '%',         width: 7  },
    ];
    ws.columns = cols;

    ws.addRow([
      '№', 'Ism Familiya',
      ...allDates.map(d => new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' })),
      'Jami', 'Keldi', 'Kelmadi', '%',
    ]);
    this.styleHeader(ws, 1, cols.length);

    const statusChar: Record<string, string> = { PRESENT: '✓', ABSENT: '✗', LATE: '⏱', EXCUSED: 'S' };

    group.members.forEach((m, i) => {
      const att = m.student.attendance;
      const present = att.filter(a => a.status === 'PRESENT').length;
      const absent  = att.filter(a => a.status === 'ABSENT').length;
      const rate    = att.length ? Math.round((present / att.length) * 100) : 0;

      const rowData: any = {
        no: i + 1,
        name: `${m.student.user.firstName} ${m.student.user.lastName}`,
      };
      allDates.forEach(d => {
        const rec = att.find(a => a.date.toISOString().startsWith(d));
        rowData[d] = rec ? statusChar[rec.status] : '';
      });
      rowData.total   = att.length;
      rowData.present = present;
      rowData.absent  = absent;
      rowData.rate    = rate + '%';

      const row = ws.addRow(rowData);
      this.styleDataRow(row, i % 2 === 1);

      // Status hujayra rangi
      allDates.forEach(d => {
        const rec = att.find(a => a.date.toISOString().startsWith(d));
        if (!rec) return;
        const cell = row.getCell(d);
        cell.alignment = { horizontal: 'center' };
        if (rec.status === 'PRESENT') cell.font = { color: { argb: 'FF16A34A' }, bold: true };
        else if (rec.status === 'ABSENT') cell.font = { color: { argb: 'FFDC2626' }, bold: true };
        else if (rec.status === 'LATE') cell.font = { color: { argb: 'FFD97706' } };
      });
    });

    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf as unknown as ArrayBuffer);
  }
}
