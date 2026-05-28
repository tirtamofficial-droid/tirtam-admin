-- Rename task status Pending → Not started
alter table public.tasks drop constraint if exists tasks_status_check;

update public.tasks
set status = 'Not started'
where status = 'Pending';

alter table public.tasks
  alter column status set default 'Not started';

alter table public.tasks
  add constraint tasks_status_check
  check (status in ('Not started', 'In Progress', 'Blocked', 'Review', 'Completed'));
