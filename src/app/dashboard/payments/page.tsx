"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Loader2,
  CheckCircle,
  CreditCard,
  FileText,
  Printer,
  Mail,
  Send,
  Check,
  MessageSquare,
  Building2,
  Copy,
  AlertCircle,
  QrCode,
  Calendar,
  Info,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Layers,
  List,
  IndianRupee,
  RefreshCw,
  Wallet,
  Coins,
  ArrowRight,
  User,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

interface Student {
  _id: string;
  name: string;
  email: string;
  phone: string;
  seatNumber: string;
  feeStatus: string;
  feeAmount: number;
}

interface Payment {
  _id: string;
  studentId: string;
  studentName: string;
  amount: number;
  months: number;
  totalPrice: number;
  paidAmount?: number;
  dueAmount?: number;
  advanceAmount?: number;
  paymentType?: "full" | "partial" | "advance";
  remarks?: string;
  paymentMethod: string;
  date: string;
  transactionId?: string;
  utr?: string;
  receiptNumber?: string;
  status: string;
  createdAt: string;
}

export default function PaymentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [modalStudentSearch, setModalStudentSearch] = useState("");

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudentFilter, setSelectedStudentFilter] = useState("all");
  const [selectedMethodFilter, setSelectedMethodFilter] = useState("all");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [viewMode, setViewMode] = useState<"grouped" | "flat">("grouped");
  const [collapsedMonths, setCollapsedMonths] = useState<
    Record<string, boolean>
  >({});

  // Complete Due Modal State
  const [dueModalOpen, setDueModalOpen] = useState(false);
  const [selectedDuePayment, setSelectedDuePayment] = useState<Payment | null>(
    null,
  );
  const [clearingDue, setClearingDue] = useState(false);
  const [dueFormData, setDueFormData] = useState({
    clearAmount: "",
    paymentMethod: "cash",
    date: new Date().toISOString().split("T")[0],
    utr: "",
    remarks: "",
  });

  // Invoice Modal State
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [activePayment, setActivePayment] = useState<Payment | null>(null);
  const [activeStudentDetail, setActiveStudentDetail] =
    useState<Student | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Add Payment Form State
  const [formError, setFormError] = useState("");
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const [formData, setFormData] = useState({
    studentId: "",
    months: "1",
    paidAmount: "",
    remarks: "",
    paymentMethod: "cash",
    date: new Date().toISOString().split("T")[0],
    utr: "",
  });

  useEffect(() => {
    fetchStudents();
    fetchPayments();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/students?limit=200");
      const data = await response.json();
      if (data.success) {
        setStudents(data.data);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/payments?limit=1000");
      const data = await response.json();
      if (data.success) {
        setPayments(data.data);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format billing month range
  const getPayMonthName = (dateStr: string, monthsCount: number = 1) => {
    if (!dateStr) return "-";
    const pDate = new Date(dateStr);
    if (isNaN(pDate.getTime())) return "-";

    if (monthsCount <= 1) {
      return pDate.toLocaleString("en-IN", { month: "short", year: "numeric" });
    } else {
      const endDate = new Date(pDate);
      endDate.setMonth(endDate.getMonth() + monthsCount - 1);
      const startStr = pDate.toLocaleString("en-IN", {
        month: "short",
        year: "2-digit",
      });
      const endStr = endDate.toLocaleString("en-IN", {
        month: "short",
        year: "2-digit",
      });
      return `${startStr} - ${endStr}`;
    }
  };

  const getMonthKey = (dateStr: string) => {
    if (!dateStr) return "Unknown Month";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Unknown Month";
    return d.toLocaleString("en-IN", { month: "long", year: "numeric" });
  };

  const getMonthSortKey = (dateStr: string) => {
    if (!dateStr) return "0000-00";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "0000-00";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  // Available unique months list for filter dropdown
  const availableMonths = useMemo(() => {
    const monthMap = new Map<string, string>();
    payments.forEach((p) => {
      const sortKey = getMonthSortKey(p.date);
      const label = getMonthKey(p.date);
      if (!monthMap.has(sortKey)) {
        monthMap.set(sortKey, label);
      }
    });
    return Array.from(monthMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([sortKey, label]) => ({ sortKey, label }));
  }, [payments]);

  // Date range presets
  const handleDatePreset = (
    preset: "this-month" | "last-month" | "last-30" | "this-year" | "clear",
  ) => {
    const now = new Date();
    if (preset === "clear") {
      setFromDate("");
      setToDate("");
      setSelectedMonthFilter("all");
      return;
    }

    if (preset === "this-month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setFromDate(firstDay.toISOString().split("T")[0]);
      setToDate(lastDay.toISOString().split("T")[0]);
      setSelectedMonthFilter("all");
    } else if (preset === "last-month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      setFromDate(firstDay.toISOString().split("T")[0]);
      setToDate(lastDay.toISOString().split("T")[0]);
      setSelectedMonthFilter("all");
    } else if (preset === "last-30") {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setFromDate(past30.toISOString().split("T")[0]);
      setToDate(now.toISOString().split("T")[0]);
      setSelectedMonthFilter("all");
    } else if (preset === "this-year") {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      const lastDay = new Date(now.getFullYear(), 11, 31);
      setFromDate(firstDay.toISOString().split("T")[0]);
      setToDate(lastDay.toISOString().split("T")[0]);
      setSelectedMonthFilter("all");
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedStudentFilter("all");
    setSelectedMethodFilter("all");
    setSelectedMonthFilter("all");
    setSelectedStatusFilter("all");
    setFromDate("");
    setToDate("");
  };

  const hasActiveFilters =
    searchTerm !== "" ||
    selectedStudentFilter !== "all" ||
    selectedMethodFilter !== "all" ||
    selectedMonthFilter !== "all" ||
    selectedStatusFilter !== "all" ||
    fromDate !== "" ||
    toDate !== "";

  // Filtered payments calculation
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // 1. Text Search
      if (searchTerm.trim() !== "") {
        const query = searchTerm.toLowerCase();
        const studentObj = students.find(
          (s) => s._id === p.studentId || s.name === p.studentName,
        );
        const matchName = p.studentName?.toLowerCase().includes(query);
        const matchMethod = p.paymentMethod?.toLowerCase().includes(query);
        const matchUtr = p.utr?.toLowerCase().includes(query);
        const matchTxn = p.transactionId?.toLowerCase().includes(query);
        const matchReceipt = p.receiptNumber?.toLowerCase().includes(query);
        const matchRemarks = p.remarks?.toLowerCase().includes(query);
        const matchSeat = studentObj?.seatNumber?.toLowerCase().includes(query);
        const matchEmail = studentObj?.email?.toLowerCase().includes(query);
        const matchPhone = studentObj?.phone?.includes(query);
        const matchMonthName = getPayMonthName(p.date, p.months)
          .toLowerCase()
          .includes(query);

        if (
          !matchName &&
          !matchMethod &&
          !matchUtr &&
          !matchTxn &&
          !matchReceipt &&
          !matchRemarks &&
          !matchSeat &&
          !matchEmail &&
          !matchPhone &&
          !matchMonthName
        ) {
          return false;
        }
      }

      // 2. Student Dropdown Filter
      if (
        selectedStudentFilter !== "all" &&
        p.studentId !== selectedStudentFilter
      ) {
        return false;
      }

      // 3. Payment Method Filter
      if (
        selectedMethodFilter !== "all" &&
        p.paymentMethod !== selectedMethodFilter
      ) {
        return false;
      }

      // 4. Specific Month Filter
      if (
        selectedMonthFilter !== "all" &&
        getMonthSortKey(p.date) !== selectedMonthFilter
      ) {
        return false;
      }

      // 5. Status / Balance Filter
      if (
        selectedStatusFilter === "due" &&
        !(p.dueAmount && p.dueAmount > 0) &&
        p.status !== "partial"
      ) {
        return false;
      }
      if (
        selectedStatusFilter === "advance" &&
        !(p.advanceAmount && p.advanceAmount > 0)
      ) {
        return false;
      }
      if (
        selectedStatusFilter === "completed" &&
        ((p.dueAmount && p.dueAmount > 0) || p.status === "partial")
      ) {
        return false;
      }

      // 6. From Date Filter
      if (fromDate) {
        const pDate = new Date(p.date);
        const fDate = new Date(fromDate);
        fDate.setHours(0, 0, 0, 0);
        if (pDate < fDate) return false;
      }

      // 7. To Date Filter
      if (toDate) {
        const pDate = new Date(p.date);
        const tDate = new Date(toDate);
        tDate.setHours(23, 59, 59, 999);
        if (pDate > tDate) return false;
      }

      return true;
    });
  }, [
    payments,
    students,
    searchTerm,
    selectedStudentFilter,
    selectedMethodFilter,
    selectedMonthFilter,
    selectedStatusFilter,
    fromDate,
    toDate,
  ]);

  // Group filtered payments by month
  interface MonthGroup {
    sortKey: string;
    monthLabel: string;
    totalFee: number;
    totalCollected: number;
    totalDue: number;
    count: number;
    cashAmount: number;
    onlineAmount: number;
    otherAmount: number;
    payments: Payment[];
  }

  const groupedByMonths = useMemo(() => {
    const groups: Record<string, MonthGroup> = {};

    filteredPayments.forEach((p) => {
      const sortKey = getMonthSortKey(p.date);
      const monthLabel = getMonthKey(p.date);
      const actualPaid =
        p.paidAmount !== undefined ? p.paidAmount : p.totalPrice;
      const due = p.dueAmount || 0;

      if (!groups[sortKey]) {
        groups[sortKey] = {
          sortKey,
          monthLabel,
          totalFee: 0,
          totalCollected: 0,
          totalDue: 0,
          count: 0,
          cashAmount: 0,
          onlineAmount: 0,
          otherAmount: 0,
          payments: [],
        };
      }

      groups[sortKey].payments.push(p);
      groups[sortKey].totalFee += p.totalPrice || 0;
      groups[sortKey].totalCollected += actualPaid || 0;
      groups[sortKey].totalDue += due;
      groups[sortKey].count += 1;

      if (p.paymentMethod === "cash") {
        groups[sortKey].cashAmount += actualPaid;
      } else if (p.paymentMethod === "online") {
        groups[sortKey].onlineAmount += actualPaid;
      } else {
        groups[sortKey].otherAmount += actualPaid;
      }
    });

    return Object.values(groups).sort((a, b) =>
      b.sortKey.localeCompare(a.sortKey),
    );
  }, [filteredPayments]);

  // Summary statistics for current view
  const summaryStats = useMemo(() => {
    const totalFee = filteredPayments.reduce(
      (sum, p) => sum + (p.totalPrice || 0),
      0,
    );
    const totalCollected = filteredPayments.reduce((sum, p) => {
      const paid = p.paidAmount !== undefined ? p.paidAmount : p.totalPrice;
      return sum + paid;
    }, 0);
    const totalDue = filteredPayments.reduce(
      (sum, p) => sum + (p.dueAmount || 0),
      0,
    );
    const count = filteredPayments.length;
    const dueCount = filteredPayments.filter(
      (p) => (p.dueAmount && p.dueAmount > 0) || p.status === "partial",
    ).length;

    return {
      totalFee,
      totalCollected,
      totalDue,
      count,
      dueCount,
      avgPerPayment: count > 0 ? Math.round(totalCollected / count) : 0,
    };
  }, [filteredPayments]);

  const toggleMonthCollapse = (sortKey: string) => {
    setCollapsedMonths((prev) => ({
      ...prev,
      [sortKey]: !prev[sortKey],
    }));
  };

  const expandAllMonths = () => {
    setCollapsedMonths({});
  };

  const collapseAllMonths = () => {
    const collapsed: Record<string, boolean> = {};
    groupedByMonths.forEach((g) => {
      collapsed[g.sortKey] = true;
    });
    setCollapsedMonths(collapsed);
  };

  // Duplicate payment detection in add form
  const getDuplicatePayment = () => {
    if (!formData.studentId || !formData.date) return null;
    const selectedDate = new Date(formData.date);
    if (isNaN(selectedDate.getTime())) return null;
    const selYear = selectedDate.getFullYear();
    const selMonth = selectedDate.getMonth();

    return payments.find((p) => {
      if (p.studentId !== formData.studentId) return false;
      const pDate = new Date(p.date);
      return pDate.getFullYear() === selYear && pDate.getMonth() === selMonth;
    });
  };

  const duplicatePayment = getDuplicatePayment();

  const calculateTotal = () => {
    if (!selectedStudent) return 0;
    const months = parseInt(formData.months) || 1;
    return selectedStudent.feeAmount * months;
  };

  // Filtered students for Add Payment Modal Search
  const modalFilteredStudents = useMemo(() => {
    if (!modalStudentSearch.trim()) return students;
    const q = modalStudentSearch.toLowerCase();
    return students.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.phone?.includes(q) ||
        (s.seatNumber && s.seatNumber.toLowerCase().includes(q)),
    );
  }, [students, modalStudentSearch]);

  const handleStudentSelect = (studentId: string) => {
    const student = students.find((s) => s._id === studentId);
    setSelectedStudent(student || null);
    const months = parseInt(formData.months) || 1;
    const total = student ? student.feeAmount * months : 0;
    setFormData((prev) => ({
      ...prev,
      studentId,
      paidAmount: total > 0 ? total.toString() : "",
    }));
    setModalStudentSearch("");
    setFormError("");
    setAllowDuplicate(false);
  };

  const handleMonthsChange = (monthsStr: string) => {
    const months = parseInt(monthsStr) || 1;
    const total = selectedStudent ? selectedStudent.feeAmount * months : 0;
    setFormData((prev) => ({
      ...prev,
      months: monthsStr,
      paidAmount: total > 0 ? total.toString() : "",
    }));
  };

  // Difference in Add Form (Paid Amount vs Expected Total)
  const expectedTotal = calculateTotal();
  const enteredPaidAmount = parseFloat(formData.paidAmount) || 0;
  const paymentDiff = enteredPaidAmount - expectedTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (duplicatePayment && !allowDuplicate) {
      const monthName = new Date(formData.date).toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      setFormError(
        `Payment for ${monthName} has already been recorded for ${selectedStudent?.name}. Check the box below if you want to force allow duplicate/backdated payment.`,
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          studentId: formData.studentId,
          months: parseInt(formData.months),
          totalPrice: expectedTotal,
          paidAmount: enteredPaidAmount,
          remarks: formData.remarks,
          allowDuplicate,
          utr: formData.utr,
        }),
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        setDialogOpen(false);
        resetForm();
        fetchPayments();
        fetchStudents();
      } else {
        setFormError(resData.error || "Failed to record payment");
      }
    } catch (error) {
      console.error("Error saving payment:", error);
      setFormError("Network error recording payment");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      studentId: "",
      months: "1",
      paidAmount: "",
      remarks: "",
      paymentMethod: "cash",
      date: new Date().toISOString().split("T")[0],
      utr: "",
    });
    setSelectedStudent(null);
    setModalStudentSearch("");
    setFormError("");
    setAllowDuplicate(false);
  };

  // Open Complete Due Modal
  const handleOpenCompleteDue = (payment: Payment) => {
    setSelectedDuePayment(payment);
    setDueFormData({
      clearAmount: String(payment.dueAmount || 0),
      paymentMethod: "cash",
      date: new Date().toISOString().split("T")[0],
      utr: "",
      remarks: "",
    });
    setDueModalOpen(true);
  };

  // Submit Complete Due payment
  const handleCompleteDueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDuePayment) return;

    setClearingDue(true);
    try {
      const response = await fetch("/api/payments/complete-due", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: selectedDuePayment._id,
          clearAmount: parseFloat(dueFormData.clearAmount),
          paymentMethod: dueFormData.paymentMethod,
          utr: dueFormData.utr,
          date: dueFormData.date,
          remarks: dueFormData.remarks,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setDueModalOpen(false);
        setSelectedDuePayment(null);
        fetchPayments();
        fetchStudents();
      } else {
        alert(data.error || "Failed to clear due");
      }
    } catch (error) {
      console.error("Error clearing due:", error);
      alert("Network error clearing due");
    } finally {
      setClearingDue(false);
    }
  };

  // Open Invoice Dialog
  const handleOpenInvoice = (payment: Payment) => {
    setActivePayment(payment);
    const stu = students.find(
      (s) => s._id === payment.studentId || s.name === payment.studentName,
    );
    setActiveStudentDetail(stu || null);
    setEmailInput(stu?.email || "");
    setEmailStatus(null);
    setInvoiceModalOpen(true);
  };

  // Print Invoice
  const handlePrintInvoice = () => {
    window.print();
  };

  // Send Invoice Email via Hostinger Webmail SMTP API
  const handleSendInvoiceEmail = async () => {
    if (!activePayment) return;
    if (!emailInput || !emailInput.includes("@")) {
      setEmailStatus({
        type: "error",
        message: "Please enter a valid email address.",
      });
      return;
    }

    try {
      setSendingEmail(true);
      setEmailStatus(null);

      const response = await fetch("/api/payments/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: activePayment._id,
          targetEmail: emailInput,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setEmailStatus({
          type: "success",
          message: `Invoice email successfully sent to ${emailInput}`,
        });
      } else {
        setEmailStatus({
          type: "error",
          message:
            data.error || "Failed to send email. Check SMTP settings in .env",
        });
      }
    } catch (error: any) {
      console.error("Error sending email:", error);
      setEmailStatus({
        type: "error",
        message: "Network error sending invoice email.",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  // Share via WhatsApp
  const handleShareWhatsApp = () => {
    if (!activePayment) return;
    const invNo =
      activePayment.receiptNumber ||
      `INV-${activePayment._id.slice(-6).toUpperCase()}`;
    const dateFormatted = new Date(activePayment.date).toLocaleDateString(
      "en-IN",
    );
    const actualPaid =
      activePayment.paidAmount !== undefined
        ? activePayment.paidAmount
        : activePayment.totalPrice;

    const message =
      `🧾 *Aarambh Library - Official Payment Receipt*\n\n` +
      `*Invoice No:* ${invNo}\n` +
      `*Student:* ${activePayment.studentName}\n` +
      `*Total Fee:* ₹${activePayment.totalPrice.toLocaleString()}\n` +
      `*Amount Paid:* ₹${actualPaid.toLocaleString()}\n` +
      (activePayment.dueAmount && activePayment.dueAmount > 0
        ? `*Remaining Due:* ₹${activePayment.dueAmount.toLocaleString()} ⚠️\n`
        : "") +
      `*Duration:* ${activePayment.months} Month(s)\n` +
      `*Payment Method:* ${activePayment.paymentMethod.toUpperCase()}\n` +
      `*Date:* ${dateFormatted}\n` +
      (activePayment.remarks ? `*Remarks:* ${activePayment.remarks}\n` : "") +
      `\nThank you for choosing Aarambh Library! 📚`;

    const phone = activeStudentDetail?.phone
      ? activeStudentDetail.phone.replace(/[^0-9]/g, "")
      : "";
    const whatsappUrl = phone
      ? `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank");
  };

  // Copy Receipt Details
  const handleCopyReceipt = () => {
    if (!activePayment) return;
    const invNo =
      activePayment.receiptNumber ||
      `INV-${activePayment._id.slice(-6).toUpperCase()}`;
    const actualPaid =
      activePayment.paidAmount !== undefined
        ? activePayment.paidAmount
        : activePayment.totalPrice;
    const text = `Aarambh Library Receipt | Invoice #${invNo} | Student: ${activePayment.studentName} | Paid: ₹${actualPaid} / ₹${activePayment.totalPrice}${activePayment.dueAmount ? ` (Due: ₹${activePayment.dueAmount})` : ""} | Date: ${new Date(activePayment.date).toLocaleDateString()}`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <CreditCard className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            <span>Student Payments</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5">
            Record full/partial/advance payments, complete remaining dues, group
            by months & issue receipts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchPayments();
              fetchStudents();
            }}
            disabled={loading}
            className="border-slate-300 dark:border-slate-700"
          >
            <RefreshCw
              className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin text-indigo-600" : ""}`}
            />
            Refresh
          </Button>

          {/* New Payment Modal */}
          <Dialog
            open={dialogOpen}
            onOpenChange={(val) => {
              setDialogOpen(val);
              if (!val) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                New Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl sm:max-w-[850px] w-full max-h-[92vh] overflow-y-auto p-6">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-indigo-600" />
                  Add Student Payment
                </DialogTitle>
                <DialogDescription>
                  Enter payment details. Supports full payment, partial payment
                  (with remaining due tracking), and advance payments.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* Left Column: Payment Entry Form */}
                  <div className="space-y-3.5">
                    {formError && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-semibold">
                        ⚠️ {formError}
                      </div>
                    )}

                    {duplicatePayment && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-lg text-xs space-y-2">
                        <p className="font-bold flex items-center gap-1.5">
                          <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                          <span>Duplicate / Existing Payment Warning</span>
                        </p>
                        <p>
                          A payment of ₹{duplicatePayment.totalPrice} (
                          {duplicatePayment.months} Mo) has already been
                          recorded for{" "}
                          <strong>{duplicatePayment.studentName}</strong> for{" "}
                          {new Date(formData.date).toLocaleString("default", {
                            month: "long",
                            year: "numeric",
                          })}
                          .
                        </p>
                        <label className="flex items-center gap-2 pt-1 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allowDuplicate}
                            onChange={(e) =>
                              setAllowDuplicate(e.target.checked)
                            }
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Force allow duplicate / backdated payment</span>
                        </label>
                      </div>
                    )}

                    {/* Student Selection (Search + Select Combined) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold">
                          Select Student *
                        </Label>
                        {selectedStudent && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudent(null);
                              setFormData((prev) => ({
                                ...prev,
                                studentId: "",
                                paidAmount: "",
                              }));
                            }}
                            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                          >
                            Change Student
                          </button>
                        )}
                      </div>

                      {selectedStudent ? (
                        <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-indigo-600" />
                              {selectedStudent.name}
                              {selectedStudent.seatNumber && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] bg-white dark:bg-slate-900 font-mono"
                                >
                                  Seat {selectedStudent.seatNumber}
                                </Badge>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {selectedStudent.email} • +91{" "}
                              {selectedStudent.phone}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-[11px]">
                              <span>
                                Plan:{" "}
                                <strong>₹{selectedStudent.feeAmount}/mo</strong>
                              </span>
                              <span
                                className={`font-semibold capitalize ${selectedStudent.feeStatus === "paid" ? "text-emerald-600" : "text-rose-600"}`}
                              >
                                Status: {selectedStudent.feeStatus}
                              </span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedStudent(null);
                              setFormData((prev) => ({
                                ...prev,
                                studentId: "",
                                paidAmount: "",
                              }));
                            }}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* Live Search Input */}
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <Input
                              placeholder="Search student by name, seat #, email, phone..."
                              value={modalStudentSearch}
                              onChange={(e) =>
                                setModalStudentSearch(e.target.value)
                              }
                              className="pl-8 text-xs h-8 bg-white dark:bg-slate-900"
                            />
                            {modalStudentSearch && (
                              <button
                                type="button"
                                onClick={() => setModalStudentSearch("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>

                          {/* Quick Student Matching List */}
                          <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-950">
                            {modalFilteredStudents.length === 0 ? (
                              <div className="p-3 text-center text-xs text-slate-400">
                                No students match &quot;{modalStudentSearch}
                                &quot;
                              </div>
                            ) : (
                              modalFilteredStudents.slice(0, 8).map((stu) => (
                                <button
                                  key={stu._id}
                                  type="button"
                                  onClick={() => handleStudentSelect(stu._id)}
                                  className="w-full text-left p-2 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 flex items-center justify-between text-xs transition-colors"
                                >
                                  <div>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                                      {stu.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block">
                                      {stu.phone}{" "}
                                      {stu.seatNumber
                                        ? `• Seat ${stu.seatNumber}`
                                        : ""}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400 block">
                                      ₹{stu.feeAmount}/mo
                                    </span>
                                    <span
                                      className={`text-[10px] capitalize font-semibold ${
                                        stu.feeStatus === "paid"
                                          ? "text-emerald-600"
                                          : "text-rose-600"
                                      }`}
                                    >
                                      {stu.feeStatus}
                                    </span>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Number of Months & Total Fee Calculation */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">
                          Months Duration
                        </Label>
                        <Select
                          value={formData.months}
                          onValueChange={handleMonthsChange}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 6, 12].map((m) => (
                              <SelectItem key={m} value={m.toString()}>
                                {m} Month{m > 1 ? "s" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">
                          Expected Total Fee
                        </Label>
                        <div className="h-9 px-3 flex items-center bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-bold text-slate-800 dark:text-slate-200">
                          ₹{expectedTotal.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Paid Amount Field (New Requirement!) */}
                    <div className="space-y-1">
                      <Label
                        htmlFor="paidAmount"
                        className="flex items-center justify-between text-xs font-semibold"
                      >
                        <span>Paid Amount (Received ₹)</span>
                        <span className="text-[11px] text-slate-500 font-normal">
                          Total Fee: ₹{expectedTotal}
                        </span>
                      </Label>
                      <Input
                        id="paidAmount"
                        type="number"
                        placeholder="Enter amount actually paid..."
                        value={formData.paidAmount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paidAmount: e.target.value,
                          })
                        }
                        required
                        className="text-xs font-bold"
                      />

                      {/* Real-time Status Badge (Partial / Less vs Advance vs Full) */}
                      {selectedStudent && formData.paidAmount !== "" && (
                        <div className="pt-0.5">
                          {paymentDiff < 0 ? (
                            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-md text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between font-semibold">
                              <span>⚠️ Less Payment (Partial)</span>
                              <span className="font-bold text-rose-600 dark:text-rose-400">
                                Remaining Due: ₹
                                {Math.abs(paymentDiff).toLocaleString()}
                              </span>
                            </div>
                          ) : paymentDiff > 0 ? (
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-md text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between font-semibold">
                              <span>✨ Advance Payment</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                Advance: ₹{paymentDiff.toLocaleString()}
                              </span>
                            </div>
                          ) : (
                            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-md text-[11px] text-blue-700 dark:text-blue-300 font-medium text-center">
                              ✅ Exact Full Fee Payment (No Due)
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Payment Method
                      </Label>
                      <Select
                        value={formData.paymentMethod}
                        onValueChange={(v) =>
                          setFormData({ ...formData, paymentMethod: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="online">Online / UPI</SelectItem>
                          <SelectItem value="bank_transfer">
                            Bank Transfer
                          </SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* UTR / Transaction ID Field */}
                    {(formData.paymentMethod === "online" ||
                      formData.paymentMethod === "bank_transfer" ||
                      formData.paymentMethod === "card") && (
                      <div className="space-y-1">
                        <Label
                          htmlFor="utr"
                          className="flex items-center justify-between text-xs font-semibold"
                        >
                          <span>UTR Number / Transaction ID</span>
                          <span className="text-[10px] text-indigo-600 font-normal">
                            UPI Ref ID
                          </span>
                        </Label>
                        <Input
                          id="utr"
                          placeholder="e.g. 424512345678"
                          value={formData.utr}
                          onChange={(e) =>
                            setFormData({ ...formData, utr: e.target.value })
                          }
                          className="font-mono text-xs"
                        />
                      </div>
                    )}

                    {/* Payment Date */}
                    <div className="space-y-1">
                      <Label className="flex items-center gap-1.5 text-xs font-semibold">
                        <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Payment Date (Backdated / Effective)</span>
                      </Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                        required
                        className="text-xs"
                      />
                    </div>

                    {/* Remarks Field (New Requirement!) */}
                    <div className="space-y-1">
                      <Label
                        htmlFor="remarks"
                        className="text-xs font-semibold"
                      >
                        Remarks / Notes (Optional)
                      </Label>
                      <Textarea
                        id="remarks"
                        placeholder="e.g. Paid ₹500 now, rest ₹500 promised next Monday..."
                        value={formData.remarks}
                        onChange={(e) =>
                          setFormData({ ...formData, remarks: e.target.value })
                        }
                        className="text-xs"
                        rows={2}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-2"
                      disabled={
                        saving || !selectedStudent || !formData.paidAmount
                      }
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Submit Payment (₹{enteredPaidAmount.toLocaleString()})
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Right Column: Full Side Scanner / Payment Summary */}
                  <div className="flex flex-col h-full justify-between bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-5 min-h-[420px]">
                    {formData.paymentMethod === "online" ? (
                      <div className="space-y-4 flex flex-col items-center justify-center text-center h-full">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                          <QrCode className="h-5 w-5 text-indigo-600" />
                          <span>UPI QR Code Scanner</span>
                        </div>

                        {selectedStudent && (
                          <div className="px-3 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold">
                            Paid Month:{" "}
                            {getPayMonthName(
                              formData.date,
                              parseInt(formData.months) || 1,
                            )}{" "}
                            • ₹{enteredPaidAmount.toLocaleString()}
                          </div>
                        )}

                        <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md">
                          <img
                            src="/aaramb scanner.jpeg"
                            alt="Aarambh Library UPI QR Code"
                            className="w-full max-w-[220px] h-auto object-contain rounded-md"
                          />
                        </div>

                        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            Scan with any UPI App:
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Google Pay • PhonePe • Paytm • BHIM
                          </p>
                        </div>

                        <div className="w-full p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-lg text-[11px] text-amber-800 dark:text-amber-300 text-left space-y-1">
                          <p className="font-bold flex items-center gap-1">
                            <Info className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                            <span>Verification Instructions:</span>
                          </p>
                          <p>
                            After successful payment scan, copy the 12-digit UTR
                            / UPI Ref ID and enter it into the form field on the
                            left.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 flex flex-col justify-center h-full">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                          <Building2 className="h-5 w-5 text-indigo-600" />
                          <span>Payment Summary</span>
                        </div>

                        <div className="space-y-2.5 bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                          <div className="flex justify-between border-b pb-2 border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500">
                              Selected Student:
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {selectedStudent?.name || "Not selected"}
                            </span>
                          </div>
                          <div className="flex justify-between border-b pb-2 border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500">
                              Payment Mode:
                            </span>
                            <span className="font-bold uppercase text-indigo-600">
                              {formData.paymentMethod.replace("_", " ")}
                            </span>
                          </div>
                          <div className="flex justify-between border-b pb-2 border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500">
                              Target Month:
                            </span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              {getPayMonthName(
                                formData.date,
                                parseInt(formData.months) || 1,
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between border-b pb-2 border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500">Duration:</span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {formData.months} Month(s)
                            </span>
                          </div>
                          <div className="flex justify-between border-b pb-2 border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500">
                              Total Plan Fee:
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              ₹{expectedTotal.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between border-b pb-2 border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500 font-semibold">
                              Amount Paying Now:
                            </span>
                            <span className="font-extrabold text-indigo-600 text-sm">
                              ₹{enteredPaidAmount.toLocaleString()}
                            </span>
                          </div>

                          {paymentDiff < 0 && (
                            <div className="flex justify-between pt-1 text-xs font-bold text-rose-600">
                              <span>Remaining Balance Due:</span>
                              <span>
                                ₹{Math.abs(paymentDiff).toLocaleString()}
                              </span>
                            </div>
                          )}

                          {paymentDiff > 0 && (
                            <div className="flex justify-between pt-1 text-xs font-bold text-emerald-600">
                              <span>Advance Recorded:</span>
                              <span>₹{paymentDiff.toLocaleString()}</span>
                            </div>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 text-center">
                          Tip: Select <strong>Online / UPI</strong> under
                          Payment Method to show the live QR scanner on the
                          right.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary KPI Cards (Responsive & Filter-Aware) */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-indigo-100 dark:border-indigo-950 bg-gradient-to-br from-indigo-50/50 to-white dark:from-slate-900 dark:to-slate-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Total Revenue Collected
            </CardTitle>
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg text-indigo-600 dark:text-indigo-400">
              <IndianRupee className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              ₹{summaryStats.totalCollected.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              From {summaryStats.count} payment record
              {summaryStats.count === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-rose-100 dark:border-rose-950 bg-gradient-to-br from-rose-50/50 to-white dark:from-slate-900 dark:to-slate-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Pending Remaining Dues
            </CardTitle>
            <div className="p-2 bg-rose-100 dark:bg-rose-900/40 rounded-lg text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              ₹{summaryStats.totalDue.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {summaryStats.dueCount} payment
              {summaryStats.dueCount === 1 ? "" : "s"} with partial/less balance
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 dark:border-emerald-950 bg-gradient-to-br from-emerald-50/50 to-white dark:from-slate-900 dark:to-slate-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Total Plan Value
            </CardTitle>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ₹{summaryStats.totalFee.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Collection rate:{" "}
              {summaryStats.totalFee > 0
                ? `${Math.round((summaryStats.totalCollected / summaryStats.totalFee) * 100)}%`
                : "100%"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-100 dark:border-amber-950 bg-gradient-to-br from-amber-50/50 to-white dark:from-slate-900 dark:to-slate-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Avg per Transaction
            </CardTitle>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg text-amber-600 dark:text-amber-400">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              ₹{summaryStats.avgPerPayment.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Average collection size
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Toolbar */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <CardTitle className="text-base font-semibold">
                Payment Filters & Search
              </CardTitle>
            </div>

            {/* View Mode Toggle & Accordion Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewMode("grouped")}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    viewMode === "grouped"
                      ? "bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Group by Months</span>
                </button>
                <button
                  onClick={() => setViewMode("flat")}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    viewMode === "flat"
                      ? "bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                  <span>Flat List</span>
                </button>
              </div>

              {viewMode === "grouped" && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={expandAllMonths}
                    className="h-7 text-xs text-slate-600 dark:text-slate-400"
                  >
                    Expand All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={collapseAllMonths}
                    className="h-7 text-xs text-slate-600 dark:text-slate-400"
                  >
                    Collapse All
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Row 1: Search and Select Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Student, seat, remarks, UTR..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-xs h-9"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter by Specific Student */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Filter by Student
              </Label>
              <Select
                value={selectedStudentFilter}
                onValueChange={setSelectedStudentFilter}
              >
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="All Students" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">
                    All Students ({students.length})
                  </SelectItem>
                  {students.map((stu) => (
                    <SelectItem key={stu._id} value={stu._id}>
                      {stu.name}{" "}
                      {stu.seatNumber ? `(Seat: ${stu.seatNumber})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Specific Month */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Month
              </Label>
              <Select
                value={selectedMonthFilter}
                onValueChange={setSelectedMonthFilter}
              >
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {availableMonths.map((m) => (
                    <SelectItem key={m.sortKey} value={m.sortKey}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Status (Full vs Due vs Advance) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Payment Balance Status
              </Label>
              <Select
                value={selectedStatusFilter}
                onValueChange={setSelectedStatusFilter}
              >
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="due">⚠️ Has Remaining Due</SelectItem>
                  <SelectItem value="advance">✨ Advance Payments</SelectItem>
                  <SelectItem value="completed">
                    ✅ Fully Paid (No Due)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Payment Method */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Payment Method
              </Label>
              <Select
                value={selectedMethodFilter}
                onValueChange={setSelectedMethodFilter}
              >
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="online">Online / UPI</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Date Range Picker (From / To Date) + Quick Presets */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* From Date */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  From:
                </span>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="text-xs h-8 w-36"
                />
              </div>

              {/* To Date */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  To:
                </span>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="text-xs h-8 w-36"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1 pl-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDatePreset("this-month")}
                  className="h-7 text-[11px] px-2.5 border-slate-200 dark:border-slate-700"
                >
                  This Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDatePreset("last-month")}
                  className="h-7 text-[11px] px-2.5 border-slate-200 dark:border-slate-700"
                >
                  Last Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDatePreset("last-30")}
                  className="h-7 text-[11px] px-2.5 border-slate-200 dark:border-slate-700"
                >
                  Last 30 Days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDatePreset("this-year")}
                  className="h-7 text-[11px] px-2.5 border-slate-200 dark:border-slate-700"
                >
                  This Year
                </Button>
              </div>
            </div>

            {/* Clear All Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 self-start lg:self-auto"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear All Filters
              </Button>
            )}
          </div>

          {/* Active Filters Badges Indicator */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">
                Active Filters:
              </span>
              {searchTerm && (
                <Badge
                  variant="secondary"
                  className="text-[11px] gap-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                >
                  Search: &quot;{searchTerm}&quot;
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setSearchTerm("")}
                  />
                </Badge>
              )}
              {selectedStudentFilter !== "all" && (
                <Badge
                  variant="secondary"
                  className="text-[11px] gap-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                >
                  Student:{" "}
                  {students.find((s) => s._id === selectedStudentFilter)
                    ?.name || selectedStudentFilter}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setSelectedStudentFilter("all")}
                  />
                </Badge>
              )}
              {selectedMonthFilter !== "all" && (
                <Badge
                  variant="secondary"
                  className="text-[11px] gap-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                >
                  Month:{" "}
                  {availableMonths.find(
                    (m) => m.sortKey === selectedMonthFilter,
                  )?.label || selectedMonthFilter}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setSelectedMonthFilter("all")}
                  />
                </Badge>
              )}
              {selectedStatusFilter !== "all" && (
                <Badge
                  variant="secondary"
                  className="text-[11px] gap-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                >
                  Balance: {selectedStatusFilter.toUpperCase()}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setSelectedStatusFilter("all")}
                  />
                </Badge>
              )}
              {selectedMethodFilter !== "all" && (
                <Badge
                  variant="secondary"
                  className="text-[11px] gap-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                >
                  Method: {selectedMethodFilter.toUpperCase()}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setSelectedMethodFilter("all")}
                  />
                </Badge>
              )}
              {fromDate && (
                <Badge
                  variant="secondary"
                  className="text-[11px] gap-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                >
                  From: {fromDate}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setFromDate("")}
                  />
                </Badge>
              )}
              {toDate && (
                <Badge
                  variant="secondary"
                  className="text-[11px] gap-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                >
                  To: {toDate}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setToDate("")}
                  />
                </Badge>
              )}
              <span className="text-[11px] text-slate-500 font-medium">
                ({filteredPayments.length} of {payments.length} payments shown)
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Payment Content: Grouped by Months OR Flat Table */}
      {loading ? (
        <Card>
          <CardContent className="py-16 text-center text-slate-500 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
            <p className="text-sm font-medium">
              Loading payment records & monthly history...
            </p>
          </CardContent>
        </Card>
      ) : filteredPayments.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-16 text-center text-slate-500 space-y-3">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full w-12 h-12 mx-auto flex items-center justify-center text-slate-400">
              <Search className="h-6 w-6" />
            </div>
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
              No payment records found
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No payments match your current search, date range, or month
              filters. Try clearing or adjusting the filters.
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="mt-2 text-xs"
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "grouped" ? (
        /* ================= GROUP BY MONTH VIEW ================= */
        <div className="space-y-4">
          {groupedByMonths.map((group) => {
            const isCollapsed = !!collapsedMonths[group.sortKey];

            return (
              <Card
                key={group.sortKey}
                className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm transition-all"
              >
                {/* Month Group Header */}
                <div
                  onClick={() => toggleMonthCollapse(group.sortKey)}
                  className="cursor-pointer bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-900/90 dark:hover:bg-slate-800/80 p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                          {group.monthLabel}
                        </h2>
                        <Badge
                          variant="outline"
                          className="text-xs font-semibold bg-white dark:bg-slate-950"
                        >
                          {group.count} payment{group.count === 1 ? "" : "s"}
                        </Badge>
                        {group.totalDue > 0 && (
                          <Badge variant="destructive" className="text-[10px]">
                            Due: ₹{group.totalDue.toLocaleString()}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Cash: ₹{group.cashAmount.toLocaleString()} • Online/UPI:
                        ₹{group.onlineAmount.toLocaleString()}
                        {group.otherAmount > 0
                          ? ` • Other: ₹${group.otherAmount.toLocaleString()}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                        Monthly Collected
                      </span>
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{group.totalCollected.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      {isCollapsed ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronUp className="h-5 w-5 text-indigo-600" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Month Payment Items Table */}
                {!isCollapsed && (
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-white dark:bg-slate-950">
                            <TableHead className="w-[110px]">
                              Receipt No
                            </TableHead>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Amount Paid / Fee</TableHead>
                            <TableHead>Balance Status</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Paid Month</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Remarks</TableHead>
                            <TableHead>Payment Date</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.payments.map((payment) => {
                            const invNo =
                              payment.receiptNumber ||
                              `INV-${payment._id.slice(-6).toUpperCase()}`;
                            const studentObj = students.find(
                              (s) =>
                                s._id === payment.studentId ||
                                s.name === payment.studentName,
                            );
                            const actualPaid =
                              payment.paidAmount !== undefined
                                ? payment.paidAmount
                                : payment.totalPrice;
                            const hasDue =
                              (payment.dueAmount && payment.dueAmount > 0) ||
                              payment.status === "partial";
                            const hasAdvance =
                              payment.advanceAmount &&
                              payment.advanceAmount > 0;

                            return (
                              <TableRow
                                key={payment._id}
                                className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50"
                              >
                                <TableCell className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                                  {invNo}
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium text-slate-900 dark:text-white">
                                    {payment.studentName}
                                  </div>
                                  {studentObj?.seatNumber && (
                                    <span className="text-[11px] text-slate-500 block">
                                      Seat: {studentObj.seatNumber}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                                    ₹{actualPaid.toLocaleString()}
                                  </div>
                                  {actualPaid !== payment.totalPrice && (
                                    <span className="text-[10px] text-slate-400 block">
                                      Total Fee: ₹
                                      {payment.totalPrice.toLocaleString()}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {hasDue ? (
                                    <div className="flex flex-col gap-1 items-start">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                        <AlertCircle className="h-3 w-3" />
                                        Due: ₹
                                        {payment.dueAmount?.toLocaleString()}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() =>
                                          handleOpenCompleteDue(payment)
                                        }
                                        className="h-6 text-[10px] px-2 bg-amber-600 hover:bg-amber-700 text-black font-semibold gap-1 shadow-sm"
                                      >
                                        <Coins className="h-3 w-3" />
                                        Clear Due
                                      </Button>
                                    </div>
                                  ) : hasAdvance ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                      Advance: ₹
                                      {payment.advanceAmount?.toLocaleString()}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                                      <CheckCircle className="h-3 w-3" />
                                      Fully Paid
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-xs">
                                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-medium">
                                    {payment.months} Mo
                                  </span>
                                </TableCell>
                                <TableCell className="font-semibold text-indigo-700 dark:text-indigo-300 text-xs whitespace-nowrap">
                                  {getPayMonthName(
                                    payment.date,
                                    payment.months,
                                  )}
                                </TableCell>
                                <TableCell className="capitalize text-xs">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                                      payment.paymentMethod === "online"
                                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                        : payment.paymentMethod === "cash"
                                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                    }`}
                                  >
                                    {payment.paymentMethod.replace("_", " ")}
                                  </span>
                                </TableCell>
                                <TableCell
                                  className="text-xs text-slate-600 dark:text-slate-400 max-w-[150px] truncate"
                                  title={payment.remarks || ""}
                                >
                                  {payment.remarks || "-"}
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-xs text-slate-700 dark:text-slate-300">
                                  {new Date(payment.date).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenInvoice(payment)}
                                    className="h-7 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950"
                                  >
                                    <FileText className="h-3.5 w-3.5 mr-1 text-indigo-500" />
                                    Invoice
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        /* ================= FLAT TABLE VIEW ================= */
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Payment History Records ({filteredPayments.length})
              </CardTitle>
              <span className="text-xs text-slate-500">
                Sorted by payment date descending
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt No</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Amount Paid / Fee</TableHead>
                    <TableHead>Balance Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Paid Month</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => {
                    const invNo =
                      payment.receiptNumber ||
                      `INV-${payment._id.slice(-6).toUpperCase()}`;
                    const studentObj = students.find(
                      (s) =>
                        s._id === payment.studentId ||
                        s.name === payment.studentName,
                    );
                    const actualPaid =
                      payment.paidAmount !== undefined
                        ? payment.paidAmount
                        : payment.totalPrice;
                    const hasDue =
                      (payment.dueAmount && payment.dueAmount > 0) ||
                      payment.status === "partial";
                    const hasAdvance =
                      payment.advanceAmount && payment.advanceAmount > 0;

                    return (
                      <TableRow key={payment._id}>
                        <TableCell className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                          {invNo}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div>{payment.studentName}</div>
                          {studentObj?.seatNumber && (
                            <span className="text-[11px] text-slate-500 block">
                              Seat: {studentObj.seatNumber}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">
                            ₹{actualPaid.toLocaleString()}
                          </div>
                          {actualPaid !== payment.totalPrice && (
                            <span className="text-[10px] text-slate-400 block">
                              Fee: ₹{payment.totalPrice.toLocaleString()}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {hasDue ? (
                            <div className="flex flex-col gap-1 items-start">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                <AlertCircle className="h-3 w-3" />
                                Due: ₹{payment.dueAmount?.toLocaleString()}
                              </span>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleOpenCompleteDue(payment)}
                                className="h-6 text-[10px] px-2 bg-amber-600 hover:bg-amber-700 text-black font-semibold gap-1 shadow-sm"
                              >
                                <Coins className="h-3 w-3" />
                                Clear Due
                              </Button>
                            </div>
                          ) : hasAdvance ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Advance: ₹
                              {payment.advanceAmount?.toLocaleString()}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                              <CheckCircle className="h-3 w-3" />
                              Fully Paid
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{payment.months} Mo</TableCell>
                        <TableCell className="font-semibold text-indigo-700 dark:text-indigo-300 text-xs whitespace-nowrap">
                          {getPayMonthName(payment.date, payment.months)}
                        </TableCell>
                        <TableCell className="capitalize text-xs">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                              payment.paymentMethod === "online"
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                : payment.paymentMethod === "cash"
                                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            {payment.paymentMethod.replace("_", " ")}
                          </span>
                        </TableCell>
                        <TableCell
                          className="text-xs text-slate-600 dark:text-slate-400 max-w-[150px] truncate"
                          title={payment.remarks || ""}
                        >
                          {payment.remarks || "-"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          {new Date(payment.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenInvoice(payment)}
                            className="h-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950"
                          >
                            <FileText className="h-3.5 w-3.5 mr-1 text-indigo-500" />
                            Invoice
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complete Due Modal Dialog (New Feature!) */}
      <Dialog open={dueModalOpen} onOpenChange={setDueModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <Coins className="h-5 w-5 text-amber-600" />
              Complete Remaining Due Payment
            </DialogTitle>
            <DialogDescription>
              Record clearance of pending balance for{" "}
              {selectedDuePayment?.studentName}.
            </DialogDescription>
          </DialogHeader>

          {selectedDuePayment && (
            <form onSubmit={handleCompleteDueSubmit} className="space-y-4 pt-2">
              {/* Due Summary Card */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student Name:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedDuePayment.studentName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Plan Fee:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    ₹{selectedDuePayment.totalPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Already Paid:</span>
                  <span className="font-semibold text-emerald-600">
                    ₹
                    {(selectedDuePayment.paidAmount !== undefined
                      ? selectedDuePayment.paidAmount
                      : selectedDuePayment.totalPrice -
                        (selectedDuePayment.dueAmount || 0)
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-rose-600">
                    Outstanding Due Balance:
                  </span>
                  <span className="font-extrabold text-base text-rose-600">
                    ₹{selectedDuePayment.dueAmount?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Amount to Pay Now */}
              <div className="space-y-1.5">
                <Label htmlFor="clearAmount" className="text-xs font-semibold">
                  Amount Paying Now (₹)
                </Label>
                <Input
                  id="clearAmount"
                  type="number"
                  placeholder="Amount to clear..."
                  value={dueFormData.clearAmount}
                  onChange={(e) =>
                    setDueFormData({
                      ...dueFormData,
                      clearAmount: e.target.value,
                    })
                  }
                  required
                  className="text-sm font-bold"
                />
                <p className="text-[11px] text-slate-500">
                  Default is full remaining due (₹{selectedDuePayment.dueAmount}
                  ). You can also enter a partial clearance.
                </p>
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Payment Method</Label>
                <Select
                  value={dueFormData.paymentMethod}
                  onValueChange={(v) =>
                    setDueFormData({ ...dueFormData, paymentMethod: v })
                  }
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="online">Online / UPI</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* UTR if online */}
              {dueFormData.paymentMethod !== "cash" && (
                <div className="space-y-1.5">
                  <Label htmlFor="dueUtr" className="text-xs font-semibold">
                    UTR / Transaction ID
                  </Label>
                  <Input
                    id="dueUtr"
                    placeholder="e.g. 424512345678"
                    value={dueFormData.utr}
                    onChange={(e) =>
                      setDueFormData({ ...dueFormData, utr: e.target.value })
                    }
                    className="text-xs font-mono"
                  />
                </div>
              )}

              {/* Payment Date */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Date of Payment</Label>
                <Input
                  type="date"
                  value={dueFormData.date}
                  onChange={(e) =>
                    setDueFormData({ ...dueFormData, date: e.target.value })
                  }
                  required
                  className="text-xs"
                />
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <Label htmlFor="dueRemarks" className="text-xs font-semibold">
                  Remarks / Clearance Note
                </Label>
                <Input
                  id="dueRemarks"
                  placeholder="e.g. Remaining ₹500 cleared in cash"
                  value={dueFormData.remarks}
                  onChange={(e) =>
                    setDueFormData({ ...dueFormData, remarks: e.target.value })
                  }
                  className="text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDueModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={clearingDue || !dueFormData.clearAmount}
                  className="bg-emerald-600 hover:bg-emerald-700 text-black gap-1.5"
                >
                  {clearingDue ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      Clearing...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Clear ₹
                      {parseFloat(
                        dueFormData.clearAmount || "0",
                      ).toLocaleString()}{" "}
                      Due
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Invoice Details & Actions Dialog */}
      <Dialog open={invoiceModalOpen} onOpenChange={setInvoiceModalOpen}>
        <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          {activePayment && (
            <div>
              {/* Printable Invoice Container */}
              <div id="printable-invoice" className="p-6 sm:p-8 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b pb-6 border-slate-200 dark:border-slate-800">
                  <BrandLogo
                    size="lg"
                    subText="Official Payment Receipt & Invoice"
                  />
                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        activePayment.dueAmount && activePayment.dueAmount > 0
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      }`}
                    >
                      {activePayment.dueAmount && activePayment.dueAmount > 0
                        ? "PARTIAL PAYMENT RECEIPT"
                        : "PAID RECEIPT"}
                    </span>
                    <p className="text-xs text-slate-500 mt-1 font-mono">
                      {activePayment.receiptNumber ||
                        `INV-${activePayment._id.slice(-6).toUpperCase()}`}
                    </p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-500 block mb-0.5">
                      Billed To:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm block">
                      {activePayment.studentName}
                    </span>
                    {activeStudentDetail?.email && (
                      <span className="text-slate-500 block">
                        {activeStudentDetail.email}
                      </span>
                    )}
                    {activeStudentDetail?.phone && (
                      <span className="text-slate-500 block">
                        +91 {activeStudentDetail.phone}
                      </span>
                    )}
                    {activeStudentDetail?.seatNumber && (
                      <span className="text-indigo-600 font-semibold block mt-1">
                        Assigned Seat: Seat {activeStudentDetail.seatNumber}
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-slate-500 block mb-0.5">
                      Paid Month(s):
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 block text-xs">
                      {getPayMonthName(
                        activePayment.date,
                        activePayment.months,
                      )}
                    </span>
                    <span className="text-slate-500 block mt-2">
                      Payment Date:
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      {new Date(activePayment.date).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </span>
                    <span className="text-slate-500 block mt-2">
                      Payment Method:
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white uppercase block">
                      {activePayment.paymentMethod.replace("_", " ")}
                    </span>
                    {(activePayment.utr || activePayment.transactionId) && (
                      <span className="text-slate-500 block mt-1 font-mono text-[10px]">
                        UTR / Ref:{" "}
                        <span className="text-indigo-600 font-semibold">
                          {activePayment.utr || activePayment.transactionId}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount Summary */}
                <div className="border rounded-xl p-4 border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>
                      Library Subscription Plan ({activePayment.months} Month
                      {activePayment.months > 1 ? "s" : ""})
                    </span>
                    <span>₹{activePayment.totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-slate-900 dark:text-white border-t pt-1 border-slate-100 dark:border-slate-800">
                    <span>Amount Received / Paid:</span>
                    <span className="text-emerald-600 font-bold">
                      ₹
                      {(activePayment.paidAmount !== undefined
                        ? activePayment.paidAmount
                        : activePayment.totalPrice
                      ).toLocaleString()}
                    </span>
                  </div>

                  {activePayment.dueAmount && activePayment.dueAmount > 0 ? (
                    <div className="flex justify-between text-xs font-bold text-rose-600">
                      <span>Remaining Balance Due:</span>
                      <span>₹{activePayment.dueAmount.toLocaleString()}</span>
                    </div>
                  ) : null}

                  {activePayment.advanceAmount &&
                  activePayment.advanceAmount > 0 ? (
                    <div className="flex justify-between text-xs font-bold text-emerald-600">
                      <span>Advance Amount Paid:</span>
                      <span>
                        ₹{activePayment.advanceAmount.toLocaleString()}
                      </span>
                    </div>
                  ) : null}

                  {activePayment.remarks && (
                    <div className="border-t pt-2 mt-2 text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="font-semibold block text-slate-500">
                        Remarks / Notes:
                      </span>
                      <p className="mt-0.5">{activePayment.remarks}</p>
                    </div>
                  )}
                </div>

                {/* Footer Note */}
                <div className="text-[11px] text-slate-400 text-center">
                  This is a computer-generated receipt issued by Aarambh Library
                  (info@aarambhlibrary.com).
                </div>
              </div>

              {/* Modal Action Controls */}
              <div className="bg-slate-50 dark:bg-slate-950 p-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Invoice Actions
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Download / Print */}
                  <Button
                    variant="outline"
                    onClick={handlePrintInvoice}
                    className="w-full flex items-center justify-center gap-2 border-slate-300 dark:border-slate-700"
                  >
                    <Printer className="h-4 w-4 text-indigo-500" />
                    <span>Print / Save PDF</span>
                  </Button>

                  {/* Share WhatsApp */}
                  <Button
                    variant="outline"
                    onClick={handleShareWhatsApp}
                    className="w-full flex items-center justify-center gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950"
                  >
                    <MessageSquare className="h-4 w-4 text-emerald-500" />
                    <span>Share WhatsApp</span>
                  </Button>

                  {/* Copy Link */}
                  <Button
                    variant="outline"
                    onClick={handleCopyReceipt}
                    className="w-full flex items-center justify-center gap-2 border-slate-300 dark:border-slate-700"
                  >
                    {copiedLink ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-slate-500" />
                    )}
                    <span>{copiedLink ? "Copied!" : "Copy Summary"}</span>
                  </Button>
                </div>

                {/* Hostinger Webmail SMTP Email Sender Form */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Send Invoice via Email (aarambhlibrary.com)</span>
                    </Label>
                    <span className="text-[10px] text-slate-400">
                      Hostinger Webmail SMTP
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Student email address..."
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="text-xs h-9 bg-white dark:bg-slate-900"
                    />
                    <Button
                      size="sm"
                      onClick={handleSendInvoiceEmail}
                      disabled={sendingEmail || !emailInput}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 whitespace-nowrap px-4"
                    >
                      {sendingEmail ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5 mr-1" />
                          Send Invoice
                        </>
                      )}
                    </Button>
                  </div>

                  {emailStatus && (
                    <div
                      className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                        emailStatus.type === "success"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                      }`}
                    >
                      {emailStatus.type === "success" ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <Mail className="h-4 w-4 text-rose-500 flex-shrink-0" />
                      )}
                      <span>{emailStatus.message}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
