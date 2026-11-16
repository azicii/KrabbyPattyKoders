import { useEffect, useState } from 'react';

const BASE_URL = 'https://kbk-picability-backend.onrender.com';

type ModerationReport = {
    id: number;
    reporterId: string;
    reportedUserId: string;
    contentType: string;
    contentId: number | null;
    reason: string;
    details: string | null;
    evidenceSnapshot: string | null;
    isSuspended: boolean;
    status: string;
    createdAt: string;
    reviewedAt: string | null;
};

type Props = {
    token: string;
};

export default function ModerationDashboard({ token }: Props) {
    const [reports, setReports] = useState<ModerationReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [busyReportId, setBusyReportId] = useState<number | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [suspensionDaysByReport, setSuspensionDaysByReport] =
        useState<Record<number, number>>({});
    const [error, setError] = useState<string | null>(null);

    async function removeReportedContent(reportId: number) {
        if (!window.confirm(
            `Remove the check-in content associated with report #${reportId}?`
        )) {
            return;
        }

        setBusyReportId(reportId);
        setActionError(null);

        try {
            const response = await fetch(
                `${BASE_URL}/api/reports/admin/${reportId}/remove-content`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Could not remove check-in content (${response.status}).`
                );
            }

            setRefreshKey(value => value + 1);
        } catch (err) {
            setActionError(
                err instanceof Error
                    ? err.message
                    : 'Could not remove check-in content.'
            );
        } finally {
            setBusyReportId(null);
        }
    }
    async function removeReportedComment(reportId: number) {
        if (!window.confirm(
            `Permanently remove the comment associated with report #${reportId}?`
        )) {
            return;
        }

        setBusyReportId(reportId);
        setActionError(null);

        try {
            const response = await fetch(
                `${BASE_URL}/api/reports/admin/${reportId}/remove-comment`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Could not remove comment (${response.status}).`
                );
            }

            setRefreshKey(value => value + 1);
        } catch (err) {
            setActionError(
                err instanceof Error
                    ? err.message
                    : 'Could not remove comment.'
            );
        } finally {
            setBusyReportId(null);
        }
    }
    async function unsuspendReportedUser(reportId: number) {
        if (!window.confirm(
            `Remove the suspension from the user associated with report #${reportId}?`
        )) {
            return;
        }

        setBusyReportId(reportId);
        setActionError(null);

        try {
            const response = await fetch(
                `${BASE_URL}/api/reports/admin/${reportId}/unsuspend-user`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Could not unsuspend user (${response.status}).`
                );
            }

            setRefreshKey(value => value + 1);
        } catch (err) {
            setActionError(
                err instanceof Error
                    ? err.message
                    : 'Could not unsuspend user.'
            );
        } finally {
            setBusyReportId(null);
        }
    }
    async function suspendReportedUser(reportId: number, days: number) {
        if (!Number.isInteger(days) || days < 1 || days > 365) {
            setActionError('Suspension duration must be between 1 and 365 days.');
            return;
        }

        if (!window.confirm(
            `Suspend the reported user for ${days} day(s)? Report #${reportId} will be marked as reviewed.`
        )) {
            return;
        }

        setBusyReportId(reportId);
        setActionError(null);

        try {
            const response = await fetch(
                `${BASE_URL}/api/reports/admin/${reportId}/suspend-user`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ days })
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Could not suspend user (${response.status}).`
                );
            }

            setRefreshKey(value => value + 1);
        } catch (err) {
            setActionError(
                err instanceof Error
                    ? err.message
                    : 'Could not suspend user.'
            );
        } finally {
            setBusyReportId(null);
        }
    }
    async function dismissReport(reportId: number) {
        if (!window.confirm(
            `Dismiss report #${reportId}? This will mark it as reviewed.`
        )) {
            return;
        }

        setBusyReportId(reportId);
        setActionError(null);

        try {
            const response = await fetch(
                `${BASE_URL}/api/reports/admin/${reportId}/dismiss`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Could not dismiss report (${response.status}).`
                );
            }

            setRefreshKey(value => value + 1);
        } catch (err) {
            setActionError(
                err instanceof Error
                    ? err.message
                    : 'Could not dismiss report.'
            );
        } finally {
            setBusyReportId(null);
        }
    }
    useEffect(() => {
        let cancelled = false;

        async function loadReports() {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(
                    `${BASE_URL}/api/reports/admin`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        response.status === 403
                            ? 'Administrator access required.'
                            : `Could not load reports (${response.status}).`
                    );
                }

                const data: ModerationReport[] = await response.json();

                if (!cancelled) {
                    setReports(data);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'Could not load reports.'
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadReports();

        return () => {
            cancelled = true;
        };
    }, [token, refreshKey]);

    return (
        <div className="mx-auto w-full max-w-3xl px-4 py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">
                    Moderation Dashboard
                </h1>
                <p className="mt-1 text-sm opacity-70">
                    Review user reports and community safety issues.
                </p>

                <button
                    type="button"
                    disabled={loading}
                    onClick={() => setRefreshKey(value => value + 1)}
                    className="mt-4 rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                    {loading ? 'Refreshing...' : 'Refresh reports'}
                </button>
            </div>

            {actionError && (
                <div
                    role="alert"
                    className="mb-4 rounded-xl border border-red-500/40 p-4 text-sm text-red-500"
                >
                    {actionError}
                </div>
            )}
            {loading && (
                <p className="text-sm opacity-70">
                    Loading reports...
                </p>
            )}

            {error && (
                <div
                    role="alert"
                    className="rounded-xl border border-red-500/40 p-4 text-sm text-red-500"
                >
                    {error}
                </div>
            )}

            {!loading && !error && reports.length === 0 && (
                <div className="rounded-xl border p-6 text-center">
                    <p className="font-medium">
                        No reports yet
                    </p>
                    <p className="mt-2 text-sm opacity-70">
                        New reports will appear here.
                    </p>
                </div>
            )}

            {!loading && !error && (
                <div className="space-y-4">
                    {reports.map(report => (
                        <article
                            key={report.id}
                            className="rounded-xl border p-4 shadow-sm"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <strong>
                                    Report #{report.id}
                                </strong>

                                <span className="rounded-full border px-3 py-1 text-xs">
                                    {report.status}
                                </span>
                            </div>

                            <p className="mt-3 text-sm font-medium">
                                {report.reason}
                            </p>

                            <p className="mt-1 text-sm opacity-70">
                                Content: {report.contentType}
                            </p>

                            {report.details && (
                                <div className="mt-3">
                                    <p className="text-xs font-semibold opacity-60">
                                        Reporter explanation
                                    </p>
                                    <p className="mt-1 whitespace-pre-wrap break-words text-sm">
                                        {report.details}
                                    </p>
                                </div>
                            )}

                            {report.evidenceSnapshot && (
                                <div className="mt-4 rounded-lg border p-3">
                                    <p className="text-xs font-semibold opacity-60">
                                        Reported content evidence
                                    </p>
                                    <p className="mt-2 whitespace-pre-wrap break-words text-sm">
                                        {report.evidenceSnapshot}
                                    </p>
                                </div>
                            )}

                            {report.status === 'Pending' && (
                                <div className="mt-4">
                                    <button
                                        type="button"
                                        disabled={busyReportId !== null}
                                        onClick={() => void dismissReport(report.id)}
                                        className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
                                    >
                                        {busyReportId === report.id
                                            ? 'Dismissing...'
                                            : 'Dismiss report'}
                                    </button>

                                    {!report.isSuspended && (
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <label
                                            htmlFor={`suspension-days-${report.id}`}
                                            className="text-sm font-medium"
                                        >
                                            Suspension:
                                        </label>

                                        <select
                                            id={`suspension-days-${report.id}`}
                                            value={suspensionDaysByReport[report.id] ?? 7}
                                            disabled={busyReportId !== null}
                                            onChange={event => {
                                                const days = Number(event.target.value);
                                                setSuspensionDaysByReport(previous => ({
                                                    ...previous,
                                                    [report.id]: days
                                                }));
                                            }}
                                            className="rounded-lg border bg-transparent px-3 py-2 text-sm"
                                        >
                                            {[1, 3, 7, 14, 30, 90, 365].map(days => (
                                                <option key={days} value={days}>
                                                    {days} {days === 1 ? 'day' : 'days'}
                                                </option>
                                            ))}
                                        </select>

                                        <button
                                            type="button"
                                            disabled={busyReportId !== null}
                                            onClick={() => void suspendReportedUser(
                                                report.id,
                                                suspensionDaysByReport[report.id] ?? 7
                                            )}
                                            className="rounded-lg border border-red-500/50 px-4 py-2 text-sm font-medium text-red-500 disabled:opacity-50"
                                        >
                                            {busyReportId === report.id
                                                ? 'Processing...'
                                                : 'Suspend user'}
                                        </button>
                                        </div>
                                    )}
                                    {report.contentType === 'CheckInContent' && (
                                        <button
                                            type="button"
                                            disabled={busyReportId !== null}
                                            onClick={() => void removeReportedContent(report.id)}
                                            className="ml-2 rounded-lg border border-red-500/50 px-4 py-2 text-sm font-medium text-red-500 disabled:opacity-50"
                                        >
                                            {busyReportId === report.id
                                                ? 'Processing...'
                                                : 'Remove check-in content'}
                                        </button>
                                    )}
                                    {report.contentType === 'Comment' && (
                                        <button
                                            type="button"
                                            disabled={busyReportId !== null}
                                            onClick={() => void removeReportedComment(report.id)}
                                            className="ml-2 rounded-lg border border-red-500/50 px-4 py-2 text-sm font-medium text-red-500 disabled:opacity-50"
                                        >
                                            {busyReportId === report.id
                                                ? 'Processing...'
                                                : 'Remove comment'}
                                        </button>
                                    )}
                                </div>
                            )}
                            {report.isSuspended && (
                                <div className="mt-4">
                                    <p className="mb-2 text-sm font-semibold text-red-500">
                                        Reported user is currently suspended
                                    </p>
                                    <button
                                        type="button"
                                        disabled={busyReportId !== null}
                                        onClick={() => void unsuspendReportedUser(report.id)}
                                        className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
                                    >
                                        {busyReportId === report.id
                                            ? 'Processing...'
                                            : 'Unsuspend user'}
                                    </button>
                                </div>
                            )}
                            <div className="mt-4 space-y-1 break-all text-xs opacity-60">
                                <p>
                                    Reported user: {report.reportedUserId}
                                </p>
                                <p>
                                    Reporter: {report.reporterId}
                                </p>
                                <p>
                                    Submitted: {new Date(report.createdAt).toLocaleString()}
                                </p>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}